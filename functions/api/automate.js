// functions/api/automate.js  ->  /api/automate?part=scan|auto|agent
//
// ONE file for the whole Test tab "Automate" dashboard (it used to be scan.js + auto.js + agent.js):
//   ?part=scan   the diary login + crawl       (details of every ?resource=... are in the comment above that block)
//   ?part=auto   saves the dashboard settings + word lists in D1
//   ?part=agent  the AI agent step (Groq)
// Needs: D1 binding DB, variable "code" (encrypts the saved diary password) and GROQ_API_KEY.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });


// ============================== part: scan ==============================
//
// GET  ?resource=settings            start url, username, schedule, last run (never the password)
// POST ?resource=settings            save them  (body: start_url, username, password?, every, hour, allowed?)
// POST ?resource=run                 log in + crawl now (takes up to ~half a minute)
// POST ?resource=logintest           only log in (nothing is crawled or saved) -> { loggedIn: true/false }
// GET  ?resource=latest              newest run: status, live log, list of pages (no text)
// GET  ?resource=page&id=N           the full text of one page
// GET  ?resource=results             the full text of every page of the newest finished run
// GET  ?resource=found               every page address the scans have discovered + which ones are allowed
// POST ?resource=allowed             save the allowed list (body: { allowed: ["/1/lt/page/...", ...] }); empty = scan everything
//
// Needs: the D1 binding DB (already there) and the "code" variable (the same one the site gate uses —
// it is also the key that encrypts the saved password). Tables are created automatically.
//
// Limits worth knowing: a free Cloudflare plan allows ~50 outgoing requests per call, so one scan reads at
// most MAX_PAGES pages. The scan only ever talks to manodienynas.lt.
const scanPart = (() => {


  const MAX_PAGES = 40;          // pages saved per scan
  const MAX_REQUESTS = 46;       // total outgoing requests per scan (free plan allows 50)
  const MAX_BODY = 150000;              // characters kept per page
  const KEEP_RUNS = 3;
  const DEFAULT_START = 'https://www.manodienynas.lt/';
  const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
  // links never followed: logout/delete, api + click counters + redirects to other sites, duplicate languages
  const SKIP = /atsijung|logout|signout|sign-out|delete|trinti|salinti|\/api\/|\/action\/|redirect|\/1\/(ua|ru|en)\//i;
  const FILE = /\.(pdf|docx?|xlsx?|zip|png|jpe?g|gif|css|js|svg|ico|webp)(\?|$)/i;

  /* ───────────── schema ───────────── */
  let schemaReady = null;
  function ensureSchema(db) {
    if (!schemaReady) {
      schemaReady = db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS scan_settings (id INTEGER PRIMARY KEY, start_url TEXT, username TEXT, password_enc TEXT,
          every TEXT DEFAULT 'off', hour INTEGER DEFAULT 7, allowed TEXT DEFAULT '[]', last_run TEXT, found TEXT DEFAULT '{}')`),
        db.prepare(`CREATE TABLE IF NOT EXISTS scan_runs (id TEXT PRIMARY KEY, started TEXT, finished TEXT, status TEXT, log TEXT, pages INTEGER DEFAULT 0)`),
        db.prepare(`CREATE TABLE IF NOT EXISTS scan_pages (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT, url TEXT, title TEXT, chars INTEGER, body TEXT)`),
        db.prepare(`CREATE TABLE IF NOT EXISTS scan_ignore (word TEXT PRIMARY KEY)`),
        db.prepare(`INSERT OR IGNORE INTO scan_settings (id) VALUES (1)`),
      ]).then(async () => {
        // tables made by Part 1 do not have the "found" column yet; on a fresh table this fails harmlessly
        try { await db.prepare('ALTER TABLE scan_settings ADD COLUMN found TEXT').run(); } catch (e) { /* already there */ }
        try { await db.prepare('ALTER TABLE scan_settings ADD COLUMN ignore_on INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
      }).catch((e) => { schemaReady = null; throw e; });
    }
    return schemaReady;
  }

  /* ───────────── password encryption (AES-GCM, key from the "code" variable) ───────────── */
  const b64 = (u8) => btoa(String.fromCharCode(...u8));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function aesKey(env) {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('scan-pw:' + env.code));
    return crypto.subtle.importKey('raw', h, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  async function encrypt(env, text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), new TextEncoder().encode(text));
    return b64(iv) + '.' + b64(new Uint8Array(ct));
  }
  async function decrypt(env, s) {
    const [iv, ct] = String(s || '').split('.');
    if (!iv || !ct) return '';
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await aesKey(env), unb64(ct));
    return new TextDecoder().decode(pt);
  }

  /* ───────────── tiny HTML helpers (no DOM in Workers) ───────────── */
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  function decode(s) {
    return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENT[e.toLowerCase()] ?? m;
    });
  }
  function htmlToText(html) {
    return decode(String(html || '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|noscript|svg|title|head)\b[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/t[dh]\s*>/gi, ' | ')
      .replace(/<\/(p|div|li|tr|h[1-6]|table|option|ul|ol|section|form|header|footer|nav)\s*>/gi, '\n')
      .replace(/<[^>]+>/g, ''))
      .replace(/[ \t ]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  // removes every line that is exactly one of the words in the scan_ignore table (ignores capital letters)
  function dropIgnored(text, ignore) {
    if (!ignore || !ignore.size) return text;
    return text.split('\n').filter((ln) => !ignore.has(ln.trim().toLowerCase())).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function titleOf(html, url) {
    const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || '');
    const t = m ? decode(m[1]).replace(/\s+/g, ' ').trim() : '';
    let path = '';
    try { path = new URL(url).pathname.replace(/^\/1\/lt\/page\//, ''); } catch (e) {}
    return (t && t.length < 80 ? t + ' — ' : '') + (path || url);
  }
  function attrs(str) {
    const out = {};
    const re = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let m;
    while ((m = re.exec(str))) out[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? '');
    if (/(^|\s)checked(\s|=|$)/i.test(str)) out.checked = 'checked';
    return out;
  }
  function parseForms(html) {
    const forms = [];
    const re = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
    let m;
    while ((m = re.exec(html || ''))) {
      const f = { ...attrs(m[1]), inputs: [] };
      const ire = /<(input|select|textarea)\b([^>]*)>/gi;
      let i;
      while ((i = ire.exec(m[2]))) { const a = attrs(i[2]); a.tag = i[1].toLowerCase(); f.inputs.push(a); }
      forms.push(f);
    }
    return forms;
  }
  function extractLinks(html) {
    const out = [];
    const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(html || ''))) {
      const a = attrs(m[1]);
      if (a.href) out.push({ href: a.href, text: decode(m[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() });
    }
    return out;
  }
  const isLoggedIn = (html) => extractLinks(html).some((l) => /atsijung|logout/i.test(l.href + ' ' + l.text));
  const hasPasswordBox = (html) => /<input\b[^>]*type\s*=\s*["']?password/i.test(html || '');

  // pick the real login form: exactly one password box, and not the "create new password" form
  function pickLoginForm(forms) {
    const withPw = forms.filter((f) => f.inputs.some((i) => (i.type || '').toLowerCase() === 'password'));
    const score = (f) => {
      let s = f.inputs.filter((i) => (i.type || '').toLowerCase() === 'password').length === 1 ? 2 : 0;
      if (/new_pass|regist|reset|forgot|pamirs|change|surname/i.test(f.inputs.map((i) => (i.name || '') + ' ' + (i.id || '')).join(' '))) s -= 3;
      return s;
    };
    return withPw.sort((a, b) => score(b) - score(a))[0] || null;
  }
  function buildLoginParams(form, user, pass) {
    // The first username box and the first password box get your details. If the form lists the same field
    // name again (the real login form does), the repeat is ignored instead of overwriting your details.
    const p = new URLSearchParams();
    let userSet = false, submitSet = false, pwSet = false;
    for (const el of form.inputs) {
      if (!el.name) continue;
      const t = (el.type || (el.tag === 'input' ? 'text' : '')).toLowerCase();
      if (t === 'password') {
        if (!pwSet) { p.set(el.name, pass); pwSet = true; } else if (!p.has(el.name)) p.set(el.name, '');
        continue;
      }
      if (t === 'submit') { if (!submitSet) { p.set(el.name, el.value || ''); submitSet = true; } continue; }
      if (t === 'button' || t === 'image' || t === 'file') continue;
      if (t === 'checkbox' || t === 'radio') { if (el.checked && !p.has(el.name)) p.set(el.name, el.value || 'on'); continue; }
      if (!userSet && (t === 'text' || t === 'email')) { p.set(el.name, user); userSet = true; continue; }
      if (!p.has(el.name)) p.set(el.name, el.value || '');
    }
    return p;
  }

  /* ───────────── http with a cookie jar (Workers do not keep cookies) ───────────── */
  function makeClient(host) {
    const jar = new Map();
    const st = { requests: 0 };
    const cookieHeader = () => [...jar].map(([k, v]) => k + '=' + v).join('; ');
    const store = (res) => {
      const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
      for (const c of list) {
        const [pair, ...rest] = c.split(';');
        const i = pair.indexOf('=');
        if (i < 1) continue;
        const name = pair.slice(0, i).trim(), val = pair.slice(i + 1).trim();
        const gone = !val || rest.some((x) => /^\s*max-age\s*=\s*0\s*$/i.test(x));
        if (gone) jar.delete(name); else jar.set(name, val);
      }
    };
    async function http(url, init = {}) {
      let u = url, method = init.method || 'GET', body = init.body;
      const headers = { 'User-Agent': UA, 'Accept-Language': 'lt,en;q=0.8', Accept: 'text/html,application/json;q=0.9,*/*;q=0.5', ...(init.headers || {}) };
      for (let hop = 0; hop < 8; hop++) {
        if (st.requests >= MAX_REQUESTS) return { status: 0, url: u, text: '', error: 'request limit reached' };
        const h = { ...headers };
        const ck = cookieHeader(); if (ck) h.Cookie = ck;
        st.requests++;
        const res = await fetch(u, { method, body, headers: h, redirect: 'manual' });
        store(res);
        const loc = res.headers.get('Location');
        if ([301, 302, 303, 307, 308].includes(res.status) && loc) {
          const next = new URL(loc, u);
          next.protocol = 'https:';
          if (next.hostname.replace(/^www\./, '') !== host) return { status: res.status, url: u, text: '', offsite: next.href };
          if (res.status === 303 || ((res.status === 301 || res.status === 302) && method !== 'GET')) { method = 'GET'; body = undefined; delete headers['Content-Type']; }
          u = next.href;
          continue;
        }
        const type = res.headers.get('content-type') || '';
        const text = /text|json|xml/i.test(type) ? await res.text() : '';
        return { status: res.status, url: u, text, type };
      }
      return { status: 0, url: u, text: '', error: 'too many redirects' };
    }
    return { http, st };
  }

  /* ───────────── the scan itself ───────────── */
  function allowedBy(list, href) {
    if (!list.length) return true;
    let path = href;
    try { const u = new URL(href); path = u.pathname + u.search; } catch (e) {}
    return list.some((a) => a && (path.includes(a) || href.includes(a)));
  }

  async function runScan({ db, env, runId, settings, password, loginOnly }) {
    const lines = [];
    let lastFlush = 0;
    const flush = async (force) => {
      if (!force && Date.now() - lastFlush < 700) return;
      lastFlush = Date.now();
      await db.prepare('UPDATE scan_runs SET log = ? WHERE id = ?').bind(lines.join('\n'), runId).run();
    };
    const log = async (m) => { lines.push('[' + new Date().toISOString().slice(11, 19) + ' UTC] ' + m); await flush(false); };

    const start = settings.start_url || DEFAULT_START;
    const host = new URL(start).hostname.replace(/^www\./, '');
    const allowed = (() => { try { return JSON.parse(settings.allowed || '[]').filter(Boolean); } catch (e) { return []; } })();
    const ignore = new Set();
    if (settings.ignore_on) try { const r = await db.prepare('SELECT word FROM scan_ignore').all(); for (const x of r.results || []) ignore.add(String(x.word).trim().toLowerCase()); } catch (e) { /* table missing: nothing to ignore */ }
    await log(settings.ignore_on ? 'Word list ON: ' + ignore.size + ' word(s) will be cut out of the text while scanning.' : 'Word list OFF: text is kept as the site gives it.');
    const { http, st } = makeClient(host);
    const user = settings.username || '';
    const pages = [];
    const found = new Map();            // every address seen on visited pages -> link text (for the "choose pages" picker)
    let status = 'ok';

    try {
      await log('STEP 1: opening ' + start);
      let first = await http(start);
      await log('Got the page (HTTP ' + first.status + ', ' + first.url + ')');
      if (!first.text) throw new Error(first.error || (first.offsite ? 'The start page redirected away from ' + host : 'The start page returned nothing.'));

      const pwBox = hasPasswordBox(first.text), out = isLoggedIn(first.text);
      await log('STEP 2: checking login. Password box on page: ' + (pwBox ? 'yes' : 'no') + '. Logout link on page: ' + (out ? 'yes' : 'no') + '.');
      if (pwBox && !out) {
        await log('Result: NOT logged in.');
        if (!user || !password) throw new Error('No username/password saved. Type them in the Test panel and press Save.');
        const forms = parseForms(first.text).filter((f) => f.inputs.some((i) => (i.type || '').toLowerCase() === 'password'));
        await log('Forms with a password box: ' + forms.map((f) => '[' + f.inputs.map((i) => i.name).filter(Boolean).join(', ') + ']').join(' '));
        const form = pickLoginForm(forms);
        if (!form) throw new Error('Could not find the login form.');
        const params = buildLoginParams(form, user, password);
        const action = new URL(form.action || first.url, first.url).href;
        const method = (form.method || 'post').toUpperCase();
        await log('STEP 3: logging in. Sending ' + method + ' with fields: ' + [...params].map(([k, v]) => k + (v ? '' : ' (EMPTY)')).join(', '));
        let res;
        if (method === 'GET') {
          const u = new URL(action); params.forEach((v, k) => u.searchParams.set(k, v));
          res = await http(u.href, { headers: { Referer: first.url } });
        } else {
          res = await http(action, { method: 'POST', body: params.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest', Referer: first.url, Origin: new URL(first.url).origin } });
        }
        let said = (res.text || '').replace(/\s+/g, ' ').slice(0, 300);
        if (password) said = said.split(password).join('***');
        if (user) said = said.split(user).join('<user>');
        await log('Server answered ' + res.status + ': ' + said);
        first = await http(new URL('/', start).href);
        if (!first.text) throw new Error('The main page did not load after logging in.');
        if (isLoggedIn(first.text)) await log('Login CONFIRMED (logout link found).');
        else { await log('Login NOT confirmed: no logout link on the main page. Wrong username/password, or the site wants an extra step.'); status = 'login-failed'; }
      } else if (out) {
        await log('Result: already logged in.');
      } else {
        await log('Result: no login form on this page. Continuing.');
      }

      if (status === 'ok' && !loginOnly) {
        const seen = new Set([first.url.split('#')[0]]);
        const queue = [];
        const addLinks = (html, base) => {
          for (const l of extractLinks(html)) {
            try {
              const u = new URL(l.href, base); u.hash = '';
              u.protocol = u.protocol === 'http:' ? 'https:' : u.protocol;
              if (u.protocol !== 'https:') continue;
              if (u.hostname.replace(/^www\./, '') !== host) continue;
              if (SKIP.test(u.href) || SKIP.test(l.text) || FILE.test(u.pathname)) continue;
              const key = u.pathname + u.search;
              if (!found.has(key) || (!found.get(key) && l.text)) found.set(key, l.text.slice(0, 80));
              if (seen.has(u.href)) continue;
              if (allowed.length && !allowedBy(allowed, u.href)) continue;   // not allowed: never fetched, saves time and requests
              seen.add(u.href); queue.push(u.href);
            } catch (e) {}
          }
        };
        const record = (url, html) => {
          const body = dropIgnored(htmlToText(html), ignore).slice(0, MAX_BODY);
          pages.push({ url, title: titleOf(html, url), chars: body.length, body });
        };
        addLinks(first.text, first.url);
        if (allowedBy(allowed, first.url)) record(first.url, first.text);
        await log('STEP 4: reading pages. Found ' + queue.length + ' links on the first page' + (allowed.length ? ' (only ' + allowed.length + ' allowed address part(s) are kept).' : '.'));
        for (let i = 0; i < queue.length && pages.length < MAX_PAGES; i++) {
          if (st.requests >= MAX_REQUESTS) { await log('Stopped: reached the request limit for one scan (' + MAX_REQUESTS + ').'); break; }
          const url = queue[i];
          const p = await http(url);
          if (!p.text) { await log('Skipped (' + (p.offsite ? 'leaves the site' : p.error || 'not a web page') + '): ' + url); continue; }
          if (hasPasswordBox(p.text) && !isLoggedIn(p.text)) { await log('Asked to log in: ' + url); continue; }
          addLinks(p.text, p.url);
          if (!allowedBy(allowed, p.url)) continue;
          record(p.url, p.text);
          await log('Read [' + pages.length + '] ' + p.url);
        }
      }
    } catch (e) {
      status = 'error';
      await log('ERROR: ' + (e && e.message || e));
    }

    if (loginOnly) {                                   // login test: nothing is crawled or saved
      await log('LOGIN TEST DONE. ' + (status === 'ok' ? 'Logged in.' : 'Not logged in (' + status + ').'));
      await flush(true);
      await db.prepare('UPDATE scan_runs SET status = ?, finished = ?, pages = 0 WHERE id = ?').bind(status === 'ok' ? 'login-ok' : status, new Date().toISOString(), runId).run();
      return { status, pages: 0, chars: 0, loggedIn: status === 'ok' };
    }

    // remember what was discovered (merged with earlier scans, capped)
    if (found.size) {
      try {
        const prev = (() => { try { return JSON.parse(settings.found || '{}') || {}; } catch (e) { return {}; } })();
        for (const [k, v] of found) { if (!(k in prev)) { if (Object.keys(prev).length < 400) prev[k] = v; } else if (!prev[k] && v) prev[k] = v; }
        await db.prepare('UPDATE scan_settings SET found = ? WHERE id = 1').bind(JSON.stringify(prev)).run();
      } catch (e) { lines.push('(could not save the discovered page list: ' + e.message + ')'); }
    }

    // save the pages: only a good scan that found something NEW; and only the newest scan's pages are ever kept
    const total = pages.reduce((n, p) => n + p.chars, 0);
    let saved = false;
    if (status === 'ok' && total > 0) {
      let same = false;
      try {
        const lastRun = await db.prepare('SELECT run_id FROM scan_pages ORDER BY id DESC LIMIT 1').first();
        if (lastRun) {
          const { results } = await db.prepare('SELECT url, body FROM scan_pages WHERE run_id = ? ORDER BY id').bind(lastRun.run_id).all();
          const a = (results || []).map((p) => p.url + '\n' + p.body).join('\u0001');
          same = a === pages.map((p) => p.url + '\n' + p.body).join('\u0001');
        }
      } catch (e) { /* cannot compare: just save */ }
      if (same) await log('Nothing changed since the last saved scan, so nothing was saved to D1.');
      else saved = true;
    } else {
      await log('Nothing useful to keep (' + (status === 'ok' ? 'no text found' : 'scan did not finish OK') + '), so nothing was saved to D1.');
    }
    if (saved) {
      const stmts = pages.map((p) => db.prepare('INSERT INTO scan_pages (run_id, url, title, chars, body) VALUES (?,?,?,?,?)').bind(runId, p.url, p.title, p.chars, p.body));
      for (let i = 0; i < stmts.length; i += 10) await db.batch(stmts.slice(i, i + 10));
      await db.prepare('DELETE FROM scan_pages WHERE run_id != ?').bind(runId).run();   // older page texts are never kept
    }
    await log('DONE. ' + pages.length + ' page(s), ' + total + ' characters, ' + st.requests + ' request(s). Status: ' + status + '.');
    await flush(true);
    await db.prepare('UPDATE scan_runs SET status = ?, finished = ?, pages = ? WHERE id = ?').bind(status, new Date().toISOString(), pages.length, runId).run();

    // keep only the newest few runs
    const old = await db.prepare('SELECT id FROM scan_runs ORDER BY started DESC LIMIT -1 OFFSET ?').bind(KEEP_RUNS).all();
    for (const r of old.results || []) {
      await db.batch([db.prepare('DELETE FROM scan_pages WHERE run_id = ? AND run_id != COALESCE((SELECT run_id FROM scan_pages ORDER BY id DESC LIMIT 1), \'\')').bind(r.id), db.prepare('DELETE FROM scan_runs WHERE id = ?').bind(r.id)]);
    }
    return { status, pages: pages.length, chars: total };
  }

  /* ───────────── routes ───────────── */
  function publicSettings(s) {
    return {
      start_url: s.start_url || DEFAULT_START, username: s.username || '', hasPassword: !!s.password_enc,
      every: s.every || 'off', hour: s.hour == null ? 7 : s.hour, allowed: (() => { try { return JSON.parse(s.allowed || '[]'); } catch (e) { return []; } })(),
      last_run: s.last_run || null, ignore_on: !!s.ignore_on,
    };
  }

  async function onRequestGet({ request, env }) {
    try {
      if (!env.DB) return json({ error: 'D1 binding DB is missing.' }, 500);
      await ensureSchema(env.DB);
      const q = new URL(request.url).searchParams;
      const res = q.get('resource');
      if (res === 'settings') {
        const s = await env.DB.prepare('SELECT * FROM scan_settings WHERE id = 1').first();
        return json(publicSettings(s || {}));
      }
      if (res === 'latest') {
        const run = await env.DB.prepare('SELECT * FROM scan_runs ORDER BY started DESC LIMIT 1').first();
        if (!run) return json({ run: null });
        const keep = await env.DB.prepare('SELECT run_id FROM scan_pages ORDER BY id DESC LIMIT 1').first();
        const { results } = await env.DB.prepare('SELECT id, url, title, chars FROM scan_pages WHERE run_id = ? ORDER BY id').bind(keep ? keep.run_id : run.id).all();
        return json({ run: { id: run.id, started: run.started, finished: run.finished, status: run.status, log: run.log || '', pages: run.pages }, pages: results || [] });
      }
      if (res === 'page') {
        const row = await env.DB.prepare('SELECT id, url, title, chars, body FROM scan_pages WHERE id = ?').bind(parseInt(q.get('id'), 10) || 0).first();
        return row ? json(row) : json({ error: 'Not found' }, 404);
      }
      if (res === 'found') {
        const s = (await env.DB.prepare('SELECT found, allowed FROM scan_settings WHERE id = 1').first()) || {};
        let map = {}, allowed = [];
        try { map = JSON.parse(s.found || '{}') || {}; } catch (e) {}
        try { allowed = JSON.parse(s.allowed || '[]') || []; } catch (e) {}
        const found = Object.keys(map).sort().map((path) => ({ path, text: map[path] || '' }));
        return json({ found, allowed });
      }
      if (res === 'results') {
        const run = await env.DB.prepare("SELECT run_id AS id FROM scan_pages ORDER BY id DESC LIMIT 1").first();
        if (!run) return json({ text: '', pages: 0, chars: 0 });
        run.started = run.id;
        const { results } = await env.DB.prepare('SELECT url, body FROM scan_pages WHERE run_id = ? ORDER BY id').bind(run.id).all();
        const text = (results || []).map((p) => '=== ' + p.url + ' ===\n' + p.body).join('\n\n');
        return json({ text, pages: (results || []).length, chars: text.length, started: run.started });
      }
      return json({ error: 'Unknown resource' }, 400);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  async function onRequestPost({ request, env }) {
    try {
      if (!env.DB) return json({ error: 'D1 binding DB is missing.' }, 500);
      await ensureSchema(env.DB);
      const res = new URL(request.url).searchParams.get('resource');

      if (res === 'settings') {
        const b = await request.json();
        const cur = (await env.DB.prepare('SELECT * FROM scan_settings WHERE id = 1').first()) || {};
        let start = String(b.start_url || DEFAULT_START).trim();
        try {
          const u = new URL(start);
          if (u.protocol !== 'https:' || !/(^|\.)manodienynas\.lt$/i.test(u.hostname)) throw new Error('x');
          start = u.href;
        } catch (e) { return json({ error: 'The start page must be an https://...manodienynas.lt address.' }, 400); }
        let enc = cur.password_enc || null;
        if (typeof b.password === 'string' && b.password) {
          if (!env.code) return json({ error: 'The "code" variable is missing, so the password cannot be encrypted.' }, 500);
          enc = await encrypt(env, b.password);
        }
        const every = ['off', 'hourly', 'daily'].includes(b.every) ? b.every : 'off';
        const hour = Math.min(23, Math.max(0, parseInt(b.hour, 10) || 0));
        const allowed = Array.isArray(b.allowed) ? JSON.stringify(b.allowed.map(String).slice(0, 200)) : (cur.allowed || '[]');
        await env.DB.prepare('UPDATE scan_settings SET start_url=?, username=?, password_enc=?, every=?, hour=?, allowed=? WHERE id=1')
          .bind(start, String(b.username || '').trim(), enc, every, hour, allowed).run();
        if (typeof b.ignore_on === 'boolean') await env.DB.prepare('UPDATE scan_settings SET ignore_on = ? WHERE id = 1').bind(b.ignore_on ? 1 : 0).run();
        const s = await env.DB.prepare('SELECT * FROM scan_settings WHERE id = 1').first();
        return json(publicSettings(s));
      }

      if (res === 'allowed') {
        const b = await request.json();
        const allowed = (Array.isArray(b.allowed) ? b.allowed : []).map((x) => String(x).trim().slice(0, 300)).filter(Boolean).slice(0, 200);
        await env.DB.prepare('UPDATE scan_settings SET allowed = ? WHERE id = 1').bind(JSON.stringify(allowed)).run();
        return json({ allowed });
      }

      if (res === 'run' || res === 'logintest') {
        const testOnly = res === 'logintest';
        const s = await env.DB.prepare('SELECT * FROM scan_settings WHERE id = 1').first();
        const busy = await env.DB.prepare("SELECT id, started FROM scan_runs WHERE status = 'running' ORDER BY started DESC LIMIT 1").first();
        if (busy && Date.now() - Date.parse(busy.started) < 3 * 60 * 1000) return json({ error: 'A scan is already running.' }, 409);
        let password = '';
        if (s.password_enc) {
          if (!env.code) return json({ error: 'The "code" variable is missing.' }, 500);
          try { password = await decrypt(env, s.password_enc); } catch (e) { return json({ error: 'Could not decrypt the saved password. Save it again.' }, 500); }
        }
        const runId = new Date().toISOString();
        await env.DB.batch(testOnly ? [
          env.DB.prepare("INSERT INTO scan_runs (id, started, status, log) VALUES (?, ?, 'running', '')").bind(runId, runId),
        ] : [
          env.DB.prepare("INSERT INTO scan_runs (id, started, status, log) VALUES (?, ?, 'running', '')").bind(runId, runId),
          env.DB.prepare('UPDATE scan_settings SET last_run = ? WHERE id = 1').bind(runId),
        ]);
        const out = await runScan({ db: env.DB, env, runId, settings: s, password, loginOnly: testOnly });
        return json({ id: runId, ...out });
      }
      return json({ error: 'Unknown resource' }, 400);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
  return { get: onRequestGet, post: onRequestPost };
})();

// ============================== part: auto ==============================
//
// GET  ?key=cfg|lists        -> { value: <saved JSON or null>, updated: "<iso time>" }
// POST ?key=cfg|lists        body: { value: <any JSON> }  -> { ok: true }
//
// Why D1: the same settings then show up on your PC and your phone, and survive clearing the browser.
// The page also keeps a copy in the browser, so it still works if this call fails.
// Needs only the D1 binding DB that the site already has. The table is created automatically.
const autoPart = (() => {


  const KEYS = ['cfg', 'lists'];
  const MAX = 400000;       // characters per saved value
  let ready = null;
  function ensure(db) {
    if (!ready) ready = db.prepare('CREATE TABLE IF NOT EXISTS auto_store (k TEXT PRIMARY KEY, v TEXT, updated TEXT)').run();
    return ready;
  }

  async function onRequestGet({ request, env }) {
    try {
      if (!env.DB) return json({ error: 'D1 binding DB is missing.' }, 500);
      await ensure(env.DB);
      const key = new URL(request.url).searchParams.get('key');
      if (!KEYS.includes(key)) return json({ error: 'Unknown key' }, 400);
      const row = await env.DB.prepare('SELECT v, updated FROM auto_store WHERE k = ?').bind(key).first();
      let value = null;
      if (row) { try { value = JSON.parse(row.v); } catch (e) { value = null; } }
      return json({ value, updated: row ? row.updated : null });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  async function onRequestPost({ request, env }) {
    try {
      if (!env.DB) return json({ error: 'D1 binding DB is missing.' }, 500);
      await ensure(env.DB);
      const key = new URL(request.url).searchParams.get('key');
      if (!KEYS.includes(key)) return json({ error: 'Unknown key' }, 400);
      const b = await request.json();
      const v = JSON.stringify(b && b.value === undefined ? null : b.value);
      if (v.length > MAX) return json({ error: 'Too big to save (' + v.length + ' characters, limit ' + MAX + ').' }, 413);
      await env.DB.prepare('INSERT INTO auto_store (k, v, updated) VALUES (?,?,?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated = excluded.updated')
        .bind(key, v, new Date().toISOString()).run();
      return json({ ok: true });
    } catch (e) { return json({ error: e.message }, 500); }
  }
  return { get: onRequestGet, post: onRequestPost };
})();

// ============================== part: agent ==============================
//
// POST ?resource=test   body: { model? }                  -> { ok, model, found }   checks the Groq key + model, spends no tokens
// POST ?resource=run    body: { prompt, text, model?, maxChars? }
// -> { text, model, usedChars, truncated }
//
// "prompt" is your Agent code (what the agent must do). "text" is the cleaned scan.
// Needs the Cloudflare variable GROQ_API_KEY (the same one talk-ai.js already uses).
const agentPart = (() => {


  const DEFAULT_MODEL = 'openai/gpt-oss-120b';
  const BASE = 'https://api.groq.com/openai/v1';
  const MAX_CHARS = 16000;           // keeps one request inside the free Groq per-minute token limit
  const okModel = (m) => (typeof m === 'string' && /^[\w\-./:]{3,80}$/.test(m) ? m : DEFAULT_MODEL);

  async function onRequestPost({ request, env }) {
    try {
      if (!env.GROQ_API_KEY) return json({ ok: false, error: 'Missing GROQ_API_KEY on this Pages project (Settings → Variables and Secrets).' }, 500);
      const res = new URL(request.url).searchParams.get('resource');
      const b = await request.json().catch(() => ({}));
      const model = okModel(b.model);
      const headers = { Authorization: 'Bearer ' + env.GROQ_API_KEY };

      if (res === 'test') {
        const r = await fetch(BASE + '/models', { headers });
        if (!r.ok) {
          const t = await r.text().catch(() => '');
          return json({ ok: false, error: r.status === 401 ? 'Groq rejected the key (401). Check GROQ_API_KEY.' : 'Groq answered ' + r.status + ' ' + t.slice(0, 160) }, 200);
        }
        const d = await r.json().catch(() => ({}));
        const ids = (d.data || []).map((m) => m.id);
        return json({ ok: true, model, found: ids.includes(model), models: ids.length });
      }

      if (res === 'run') {
        const prompt = String(b.prompt || '').trim();
        let text = String(b.text || '');
        if (!prompt) return json({ error: 'The Agent code box is empty. Write what the agent should do.' }, 400);
        if (!text.trim()) return json({ error: 'There is no scanned text to send.' }, 400);
        const cap = Math.min(60000, Math.max(2000, parseInt(b.maxChars, 10) || MAX_CHARS));
        const truncated = text.length > cap;
        if (truncated) text = text.slice(0, cap);
        const today = new Date().toISOString().slice(0, 10);
        const r = await fetch(BASE + '/chat/completions', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              { role: 'system', content: prompt + '\n\nToday is ' + today + '.' },
              { role: 'user', content: text },
            ],
          }),
        });
        if (!r.ok) {
          const t = await r.text().catch(() => '');
          return json({ error: (r.status === 429 ? 'Groq says too many requests / tokens right now (429). Try again in a minute. ' : r.status === 413 ? 'The text is too big for Groq (413). Delete more words first. ' : 'Groq request failed: ' + r.status + '. ') + t.slice(0, 200) }, 502);
        }
        const d = await r.json();
        const out = (d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
        return json({ text: out, model, usedChars: text.length, truncated });
      }
      return json({ error: 'Unknown resource' }, 400);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
  return { post: onRequestPost };
})();

const PARTS = { scan: scanPart, auto: autoPart, agent: agentPart };
export async function onRequest(ctx) {
  const part = new URL(ctx.request.url).searchParams.get('part');
  const mod = PARTS[part];
  if (!mod) return json({ error: 'unknown part (use ?part=scan, auto or agent)' }, 404);
  const fn = ctx.request.method === 'GET' ? mod.get : ctx.request.method === 'POST' ? mod.post : null;
  if (!fn) return json({ error: 'method not allowed' }, 405);
  return fn(ctx);
}
