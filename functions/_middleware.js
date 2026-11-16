// ONE file for the whole server side: the code gate (bottom) + every /api/ address (all the sections above it).
// Addresses are unchanged (/api/events, /api/habits, /api/push-check ...). Find a section by its "SECTION: name" comment.


// ================================ SECTION: ads  (/api/ads) ================================
const M_ads = (() => {
// functions/api/ads.js  ->  /api/ads   (uses your D1 binding named DB)
//
// Two things live here, picked with ?resource=
//
//   days  = the Ads calendar (what kind of ad you did on each date)
//     GET    /api/ads?resource=days                  -> { days: [{ date, kind, count }] }
//     POST   /api/ads?resource=days   {date, kind, count}
//            kind = 'poster' | 'video' | 'none'  ('none' just clears the day)
//
//   bank  = the poster Bank (saved posters: image + title + description + used/not used)
//     GET    /api/ads?resource=bank                  -> { items: [{ id, title, description, used, thumb, created_at }] }
//     GET    /api/ads?resource=bank&id=5             -> { item: { ...same, image } }   (full-size image)
//     POST   /api/ads?resource=bank   {title, description, image, thumb}          -> creates one
//     POST   /api/ads?resource=bank&id=5   {title?, description?, used?, image?, thumb?} -> edits one
//     DELETE /api/ads?resource=bank&id=5
//
//   orig  = the ORIGINAL, untouched photo for a bank item (exact bytes you uploaded, no shrinking).
//           The file itself lives in R2 (binding ADS_IMAGES -> bucket trade-journal-images, key ads-originals/<id>);
//           D1 only keeps a tiny marker row so the list can say has_orig = 1.
//     POST   /api/ads?resource=orig&id=5     raw file as the body (Content-Type = the photo's type, X-Orig-Name = file name)
//     GET    /api/ads?resource=orig&id=5     -> the original file itself
//     GET    /api/ads?resource=orig&id=5&idx=0  -> (legacy) a base64 piece saved by the earlier D1-only version
//
// The tables are created automatically the first time this runs, so there is NO sql file to run.

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

let schemaReady = null;
function ensureSchema(db) {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.prepare(`CREATE TABLE IF NOT EXISTS ads_days (
      date  TEXT PRIMARY KEY,
      kind  TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS ads_bank (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image       TEXT DEFAULT '',
      thumb       TEXT DEFAULT '',
      used        INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS ads_bank_orig (
      bank_id INTEGER NOT NULL,
      idx     INTEGER NOT NULL,
      total   INTEGER NOT NULL,
      mime    TEXT DEFAULT '',
      name    TEXT DEFAULT '',
      data    TEXT NOT NULL,
      PRIMARY KEY (bank_id, idx))`).run();
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const META = 'id, title, description, used, thumb, created_at, ' +
  '(SELECT CASE WHEN COUNT(*) = MAX(total) THEN 1 ELSE 0 END FROM ads_bank_orig o WHERE o.bank_id = ads_bank.id) AS has_orig';
const MAX_ORIG = 30 * 1024 * 1024;           // 30 MB per photo
const R2_KEY = (id) => 'ads-originals/' + id;   // its own folder inside the bucket, away from the trade photos
const okImg = (s, max) => typeof s === 'string' && s.startsWith('data:image/') && s.length <= max;

async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);
  try { await ensureSchema(db); } catch (e) { return json({ error: 'schema: ' + e.message }, 500); }

  const url = new URL(request.url);
  const resource = url.searchParams.get('resource') || 'days';
  const id = Number(url.searchParams.get('id')) || 0;

  /* ---------------- calendar days ---------------- */
  if (resource === 'days') {
    if (request.method === 'GET') {
      const { results } = await db.prepare('SELECT date, kind, count FROM ads_days ORDER BY date').all();
      return json({ days: results });
    }
    if (request.method === 'POST') {
      let b; try { b = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }
      if (!DATE_RE.test(b.date || '')) return json({ error: 'bad date' }, 400);
      if (b.kind === 'none') {
        await db.prepare('DELETE FROM ads_days WHERE date = ?').bind(b.date).run();
        return json({ ok: true });
      }
      if (b.kind !== 'poster' && b.kind !== 'video') return json({ error: 'bad kind' }, 400);
      const count = Math.min(999, Math.max(1, Math.round(Number(b.count) || 1)));
      await db.prepare(
        'INSERT INTO ads_days (date, kind, count) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET kind = excluded.kind, count = excluded.count'
      ).bind(b.date, b.kind, count).run();
      return json({ ok: true });
    }
    return json({ error: 'method not allowed' }, 405);
  }

  /* ---------------- bank ---------------- */
  if (resource === 'bank') {
    if (request.method === 'GET') {
      if (id) {
        const row = await db.prepare(`SELECT ${META}, image FROM ads_bank WHERE id = ?`).bind(id).first();
        return row ? json({ item: row }) : json({ error: 'not found' }, 404);
      }
      const { results } = await db.prepare(`SELECT ${META} FROM ads_bank ORDER BY id DESC`).all();
      return json({ items: results });
    }

    if (request.method === 'POST') {
      let b; try { b = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }
      if (b.image != null && b.image !== '' && !okImg(b.image, 1500000)) return json({ error: 'image too big or invalid' }, 400);
      if (b.thumb != null && b.thumb !== '' && !okImg(b.thumb, 120000)) return json({ error: 'thumbnail too big or invalid' }, 400);

      if (id) { // edit: only the fields that were sent
        const sets = [], vals = [];
        if (b.title != null)       { sets.push('title = ?');       vals.push(String(b.title).slice(0, 120)); }
        if (b.description != null) { sets.push('description = ?'); vals.push(String(b.description).slice(0, 4000)); }
        if (b.used != null)        { sets.push('used = ?');        vals.push(b.used ? 1 : 0); }
        if (b.image)               { sets.push('image = ?');       vals.push(b.image); }
        if (b.thumb)               { sets.push('thumb = ?');       vals.push(b.thumb); }
        if (!sets.length) return json({ error: 'nothing to change' }, 400);
        await db.prepare(`UPDATE ads_bank SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
        if (b.image) { // old original no longer matches the new photo
          await db.prepare('DELETE FROM ads_bank_orig WHERE bank_id = ?').bind(id).run();
          if (env.ADS_IMAGES) { try { await env.ADS_IMAGES.delete(R2_KEY(id)); } catch (e) {} }
        }
        const row = await db.prepare(`SELECT ${META} FROM ads_bank WHERE id = ?`).bind(id).first();
        return row ? json({ item: row }) : json({ error: 'not found' }, 404);
      }

      // create
      const r = await db.prepare(
        'INSERT INTO ads_bank (title, description, image, thumb, used) VALUES (?, ?, ?, ?, 0)'
      ).bind(
        String(b.title || '').slice(0, 120), String(b.description || '').slice(0, 4000),
        b.image || '', b.thumb || ''
      ).run();
      const newId = r.meta && r.meta.last_row_id;
      const row = await db.prepare(`SELECT ${META} FROM ads_bank WHERE id = ?`).bind(newId).first();
      return json({ item: row });
    }

    if (request.method === 'DELETE') {
      if (!id) return json({ error: 'id required' }, 400);
      await db.prepare('DELETE FROM ads_bank WHERE id = ?').bind(id).run();
      await db.prepare('DELETE FROM ads_bank_orig WHERE bank_id = ?').bind(id).run();
      if (env.ADS_IMAGES) { try { await env.ADS_IMAGES.delete(R2_KEY(id)); } catch (e) {} }
      return json({ ok: true });
    }
    return json({ error: 'method not allowed' }, 405);
  }

  /* ---------------- original (full-quality) photo ---------------- */
  if (resource === 'orig') {
    if (!id) return json({ error: 'id required' }, 400);

    if (request.method === 'GET') {
      // legacy: a base64 piece from the earlier D1-only version
      if (url.searchParams.has('idx')) {
        const idx = parseInt(url.searchParams.get('idx'), 10) || 0;
        const row = await db.prepare('SELECT idx, total, mime, name, data FROM ads_bank_orig WHERE bank_id = ? AND idx = ?').bind(id, idx).first();
        return row ? json(row) : json({ error: 'not found' }, 404);
      }
      // the file itself, straight from R2
      const m = await db.prepare("SELECT mime, name, (data = 'r2') AS is_r2 FROM ads_bank_orig WHERE bank_id = ? AND idx = 0").bind(id).first();
      if (!m || !m.is_r2) return json({ error: 'not found' }, 404);
      if (!env.ADS_IMAGES) return json({ error: 'R2 binding \"ADS_IMAGES\" not found' }, 500);
      const obj = await env.ADS_IMAGES.get(R2_KEY(id));
      if (!obj) return json({ error: 'not found' }, 404);
      return new Response(obj.body, {
        headers: { 'Content-Type': m.mime || 'image/jpeg', 'X-Orig-Name': encodeURIComponent(m.name || ''), 'Cache-Control': 'no-store' },
      });
    }

    if (request.method === 'POST') {
      if (!env.ADS_IMAGES) return json({ error: 'R2 binding \"ADS_IMAGES\" not found - add it in the Pages project settings' }, 500);
      const exists = await db.prepare('SELECT 1 AS x FROM ads_bank WHERE id = ?').bind(id).first();
      if (!exists) return json({ error: 'not found' }, 404);
      const buf = await request.arrayBuffer();
      if (!buf.byteLength) return json({ error: 'empty file' }, 400);
      if (buf.byteLength > MAX_ORIG) return json({ error: 'file over 30 MB' }, 413);
      const mime = (request.headers.get('Content-Type') || 'application/octet-stream').slice(0, 100);
      let name = ''; try { name = decodeURIComponent(request.headers.get('X-Orig-Name') || '').slice(0, 200); } catch (e) {}
      await env.ADS_IMAGES.put(R2_KEY(id), buf, { httpMetadata: { contentType: mime }, customMetadata: { name } });
      await db.prepare('DELETE FROM ads_bank_orig WHERE bank_id = ?').bind(id).run();
      await db.prepare("INSERT INTO ads_bank_orig (bank_id, idx, total, mime, name, data) VALUES (?, 0, 1, ?, ?, 'r2')").bind(id, mime, name).run();
      return json({ ok: true });
    }
    return json({ error: 'method not allowed' }, 405);
  }

  return json({ error: 'unknown resource' }, 400);
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: auth  (/api/auth) ================================
const M_auth = (() => {
/**
 * POST /api/auth
 * Body: { password: string }
 * Returns 200 if password matches ADMIN_PASSWORD env var, 401 otherwise.
 * No data is read or written — purely an auth check.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();
    if (password && password === env.ADMIN_PASSWORD) {
      return new Response('OK', { status: 200, headers: CORS });
    }
    return new Response('Unauthorized', { status: 401, headers: CORS });
  } catch {
    return new Response('Bad request', { status: 400, headers: CORS });
  }
}

async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: automate  (/api/automate) ================================
const M_automate = (() => {
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

  /* ───────────── custom date window (the diary shows about 1 week back and 3 weeks ahead by itself) ─────────────
     If a page has a form with two date boxes, the window you picked is typed into them and the form is sent, so the page shows YOUR dates. */
  const D_ISO = /^(\d{4})-(\d{2})-(\d{2})$/, D_DOT = /^(\d{4})\.(\d{2})\.(\d{2})$/, D_DMY = /^(\d{2})([.\/-])(\d{2})\2(\d{4})$/;
  const dateKind = (v) => { v = String(v || '').trim(); return D_ISO.test(v) ? 'iso' : D_DOT.test(v) ? 'dot' : D_DMY.test(v) ? 'dmy' : ''; };
  function fmtDate(iso, sample) {                       // write the date the same way the page wrote its own (2026-11-16 / 2026.11.16 / 16.11.2026)
    const [y, m, d] = iso.split('-'); const k = dateKind(sample);
    if (k === 'dot') return y + '.' + m + '.' + d;
    if (k === 'dmy') { const sep = D_DMY.exec(String(sample).trim())[2]; return d + sep + m + sep + y; }
    return y + '-' + m + '-' + d;
  }
  function findDateForm(html) {
    for (const f of parseForms(html)) {
      const ds = f.inputs.filter((i) => i.name && ['text', 'date', 'search', ''].includes((i.type || 'text').toLowerCase()) && ((i.type || '').toLowerCase() === 'date' || dateKind(i.value)));
      if (ds.length < 2) continue;
      let [a, b] = ds;
      if (/iki|\bto\b|_to|end|till/i.test(a.name) && /nuo|from|start|begin/i.test(b.name)) [a, b] = [b, a];   // the box named "to" comes second
      return { form: f, from: a, to: b };
    }
    return null;
  }
  async function submitRange(http, host, pageUrl, html, range, log) {
    const d = findDateForm(html);
    const path = (() => { try { return new URL(pageUrl).pathname; } catch (e) { return pageUrl; } })();
    if (!d) { await log('Dates: no date boxes on ' + path + ' (it shows the diary\'s own dates).'); return null; }
    const p = new URLSearchParams(); let submitSet = false;
    for (const el of d.form.inputs) {
      if (!el.name) continue;
      const t = (el.type || (el.tag === 'input' ? 'text' : '')).toLowerCase();
      if (el === d.from) { p.set(el.name, fmtDate(range.from, el.value)); continue; }
      if (el === d.to) { p.set(el.name, fmtDate(range.to, el.value)); continue; }
      if (el.tag !== 'input') { if (el.value) p.set(el.name, el.value); continue; }
      if (t === 'submit') { if (!submitSet) { p.set(el.name, el.value || ''); submitSet = true; } continue; }
      if (['button', 'image', 'file', 'reset', 'password'].includes(t)) continue;
      if (t === 'checkbox' || t === 'radio') { if (el.checked && !p.has(el.name)) p.set(el.name, el.value || 'on'); continue; }
      if (!p.has(el.name)) p.set(el.name, el.value || '');
    }
    const action = new URL(d.form.action || pageUrl, pageUrl); action.protocol = 'https:';
    if (action.hostname.replace(/^www\./, '') !== host) return null;
    const method = String(d.form.method || 'get').toUpperCase();
    let res;
    if (method === 'POST') res = await http(action.href, { method: 'POST', body: p.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: pageUrl } });
    else { action.search = p.toString(); res = await http(action.href, { headers: { Referer: pageUrl } }); }
    if (!res.text || (hasPasswordBox(res.text) && !isLoggedIn(res.text))) { await log('Dates: sending ' + range.from + ' to ' + range.to + ' to ' + path + ' gave no page, so the diary\'s own dates are used.'); return null; }
    await log('Dates: ' + path + ' now shows ' + range.from + ' to ' + range.to + ' (boxes "' + d.from.name + '" and "' + d.to.name + '").');
    return res;
  }

  async function runScan({ db, env, runId, settings, password, loginOnly, range }) {
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
        const ranged = async (url, html) => {
          if (!range) return { url, html };
          try { const r = await submitRange(http, host, url, html, range, log); if (r) return { url: r.url, html: r.text }; }
          catch (e) { await log('Dates: could not use your dates (' + (e && e.message || e) + ').'); }
          return { url, html };
        };
        addLinks(first.text, first.url);
        if (allowedBy(allowed, first.url)) { const r = await ranged(first.url, first.text); record(r.url, r.html); }
        await log('STEP 4: reading pages. Found ' + queue.length + ' links on the first page' + (allowed.length ? ' (only ' + allowed.length + ' allowed address part(s) are kept).' : '.'));
        for (let i = 0; i < queue.length && pages.length < MAX_PAGES; i++) {
          if (st.requests >= MAX_REQUESTS) { await log('Stopped: reached the request limit for one scan (' + MAX_REQUESTS + ').'); break; }
          const url = queue[i];
          const p = await http(url);
          if (!p.text) { await log('Skipped (' + (p.offsite ? 'leaves the site' : p.error || 'not a web page') + '): ' + url); continue; }
          if (hasPasswordBox(p.text) && !isLoggedIn(p.text)) { await log('Asked to log in: ' + url); continue; }
          addLinks(p.text, p.url);
          if (!allowedBy(allowed, p.url)) continue;
          { const r = await ranged(p.url, p.text); record(r.url, r.html); }
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
        let range = null;
        if (!testOnly) {
          try { const b = await request.json(); if (b && /^\d{4}-\d{2}-\d{2}$/.test(b.range_from || '') && /^\d{4}-\d{2}-\d{2}$/.test(b.range_to || '') && b.range_from <= b.range_to) range = { from: b.range_from, to: b.range_to }; } catch (e) {}
        }
        const runId = new Date().toISOString();
        await env.DB.batch(testOnly ? [
          env.DB.prepare("INSERT INTO scan_runs (id, started, status, log) VALUES (?, ?, 'running', '')").bind(runId, runId),
        ] : [
          env.DB.prepare("INSERT INTO scan_runs (id, started, status, log) VALUES (?, ?, 'running', '')").bind(runId, runId),
          env.DB.prepare('UPDATE scan_settings SET last_run = ? WHERE id = 1').bind(runId),
        ]);
        const out = await runScan({ db: env.DB, env, runId, settings: s, password, loginOnly: testOnly, range });
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

  // ---- day summaries: ?resource=day&date=YYYY-MM-DD (GET reads, POST saves { summary }; an empty summary deletes it). Only the summary is stored. ----
  let dayReady = null;
  const ensureDay = (db) => (dayReady || (dayReady = db.prepare('CREATE TABLE IF NOT EXISTS au_day_summary (day TEXT PRIMARY KEY, summary TEXT, updated TEXT)').run()));
  const dayOf = (request) => { const q = new URL(request.url).searchParams; return q.get('resource') === 'day' ? (/^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '') ? q.get('date') : false) : null; };

  async function onRequestGet({ request, env }) {
    try {
      if (!env.DB) return json({ error: 'D1 binding DB is missing.' }, 500);
      const day = dayOf(request);
      if (day === false) return json({ error: 'Bad date' }, 400);
      if (day) {
        await ensureDay(env.DB);
        const row = await env.DB.prepare('SELECT summary, updated FROM au_day_summary WHERE day = ?').bind(day).first();
        return json({ summary: row ? row.summary : null, updated: row ? row.updated : null });
      }
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
      const day = dayOf(request);
      if (day === false) return json({ error: 'Bad date' }, 400);
      if (day) {
        await ensureDay(env.DB);
        const b = await request.json().catch(() => ({}));
        const summary = String((b && b.summary) || '').trim().slice(0, 4000);
        if (!summary) { await env.DB.prepare('DELETE FROM au_day_summary WHERE day = ?').bind(day).run(); return json({ ok: true, deleted: true }); }
        await env.DB.prepare('INSERT INTO au_day_summary (day, summary, updated) VALUES (?,?,?) ON CONFLICT(day) DO UPDATE SET summary = excluded.summary, updated = excluded.updated')
          .bind(day, summary, new Date().toISOString()).run();
        return json({ ok: true });
      }
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
async function onRequest(ctx) {
  const part = new URL(ctx.request.url).searchParams.get('part');
  const mod = PARTS[part];
  if (!mod) return json({ error: 'unknown part (use ?part=scan, auto or agent)' }, 404);
  const fn = ctx.request.method === 'GET' ? mod.get : ctx.request.method === 'POST' ? mod.post : null;
  if (!fn) return json({ error: 'method not allowed' }, 405);
  return fn(ctx);
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: events  (/api/events) ================================
const M_events = (() => {
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM habit_events ORDER BY startMinutes ASC'
    ).all();
    const out = {};
    for (const e of results) {
      if (!out[e.dateKey]) out[e.dateKey] = [];
      out[e.dateKey].push({
        id: e.id,
        startMinutes: e.startMinutes,
        durationMinutes: e.durationMinutes,
        type: e.type,
        color: e.color,
        description: e.description,
        manualLeftPx: e.manualLeftPx,
        manualWidthPx: e.manualWidthPx,
        notify: !!e.notify,
        locked: !!e.locked,
      });
    }
    return json(out);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const entries = (body && body.entries) || {};
    const statements = [];
    for (const dateKey of Object.keys(entries)) {
      statements.push(env.DB.prepare('DELETE FROM habit_events WHERE dateKey = ?').bind(dateKey));
      for (const ev of (entries[dateKey] || [])) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO habit_events
             (id, dateKey, startMinutes, durationMinutes, type, color, description, manualLeftPx, manualWidthPx, notify, locked)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(
            ev.id, dateKey, ev.startMinutes, ev.durationMinutes,
            ev.type || '', ev.color || '', ev.description || '',
            ev.manualLeftPx ?? null, ev.manualWidthPx ?? null, ev.notify ? 1 : 0,
            ev.locked ? 1 : 0
          )
        );
      }
    }
    if (statements.length) await env.DB.batch(statements);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: files  (/api/files) ================================
const M_files = (() => {
/**
 * /api/files  — file attachments stored as base64 in D1
 *
 *  GET    /api/files              → all files grouped by date (metadata only, no `data` column)
 *                                    returns { 'YYYY-MM-DD': [ {id, name, type, size, uploaded}, ... ] }
 *  GET    /api/files?id=N         → downloads that single file with the correct Content-Type
 *  POST   /api/files              → upload (open — anyone can upload)
 *                                    Body JSON: { date, name, type, data (base64) }
 *  DELETE /api/files?id=N         → delete (open — anyone can delete)
 *
 *  Requires:
 *    DB              → D1 binding (same one used by habits.js)
 *    Table `files` (see schema.sql) — id INTEGER, date, name, type,
 *    size, data (base64 TEXT), uploaded.
 *
 *  Files are capped at 500KB raw on upload — server enforces it.
 *
 *  MERGE NOTE: an AI rewrite of this file existed (using a `habit_files`
 *  table + raw BLOB storage instead of base64 TEXT). It was NOT merged
 *  in — switching storage format would orphan/break every file already
 *  uploaded to the live `files` table. This is the original, unchanged
 *  aside from this note.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_RAW_BYTES = 500 * 1024;          // 500 KB
const DATE_RE       = /^\d{4}-\d{2}-\d{2}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function sanitizeName(name) {
  return String(name)
    .replace(/[^a-zA-Z0-9._\- ]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'file';
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function approxRawBytes(b64) {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor(b64.length * 3 / 4) - padding;
}

/* ───────── GET: list all (metadata) OR single download ───────── */
async function onRequestGet({ request, env }) {
  const url     = new URL(request.url);
  const idParam = url.searchParams.get('id');

  if (idParam) {
    const id = parseInt(idParam, 10);
    if (!Number.isInteger(id) || id < 1) {
      return new Response('Bad id', { status: 400, headers: CORS });
    }
    const row = await env.DB.prepare(
      'SELECT name, type, data FROM files WHERE id = ?'
    ).bind(id).first();
    if (!row) return new Response('Not found', { status: 404, headers: CORS });

    let bytes;
    try { bytes = b64ToBytes(row.data); }
    catch { return new Response('Corrupted file', { status: 500, headers: CORS }); }

    return new Response(bytes, {
      headers: {
        'Content-Type':  row.type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...CORS,
      },
    });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, date, name, type, size, uploaded FROM files ORDER BY uploaded DESC'
    ).all();

    const grouped = {};
    for (const row of results) {
      if (!grouped[row.date]) grouped[row.date] = [];
      grouped[row.date].push({
        id:       row.id,
        name:     row.name,
        type:     row.type || '',
        size:     row.size || 0,
        uploaded: row.uploaded,
      });
    }
    return json(grouped);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ───────── POST: upload (open to anyone) ───────── */
async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { date, name, type, data } = body || {};

    if (!date || !DATE_RE.test(date)) return json({ error: 'Bad or missing date' }, 400);
    if (!name)                        return json({ error: 'Missing name' }, 400);
    if (!data || typeof data !== 'string') return json({ error: 'Missing data' }, 400);

    const raw = approxRawBytes(data);
    if (raw > MAX_RAW_BYTES) {
      return json({ error: 'File too large — 500KB max per file.' }, 413);
    }

    const safeName = sanitizeName(name);
    const uploaded = new Date().toISOString();
    const mime     = (type && typeof type === 'string')
      ? type.slice(0, 100)
      : 'application/octet-stream';

    const result = await env.DB.prepare(
      'INSERT INTO files (date, name, type, size, data, uploaded) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(date, safeName, mime, raw, data, uploaded).run();

    const id = result.meta?.last_row_id;
    return json({ ok: true, id, name: safeName, type: mime, size: raw, uploaded });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ───────── DELETE (open to anyone) ───────── */
async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    const id  = parseInt(url.searchParams.get('id'), 10);
    if (!Number.isInteger(id) || id < 1) return json({ error: 'Bad id' }, 400);

    await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: habits  (/api/habits) ================================
const M_habits = (() => {
/**
 * GET    /api/habits                       → returns all habit entries as JSON
 * POST   /api/habits                       → upserts an entry
 * GET    /api/habits?resource=targets      → returns all target history rows
 * POST   /api/habits?resource=targets      → adds/updates a target ({field, value, effectiveFrom})
 * DELETE /api/habits?resource=targets&id=  → removes one target history row
 * GET    /api/habits?resource=settings     → returns the settings JSON blob (or null if never saved)
 * POST   /api/habits?resource=settings     → overwrites the settings JSON blob (full object, one row)
 *
 * D1 binding name: DB
 * Tables: habits, habit_targets, habit_settings (see schema.sql)
 *
 * Field model:
 *   Counters (uncapped, no minimum below 0):
 *     pushupsCount, readPagesCount, pullupsCount, oneHandPushupsCount,
 *     breathHoldSeconds
 *   Pips (capped 0-3):
 *     stretchPips, lSitPips, productivePips, cardTrickPips
 *   Plain fields:
 *     title, nDay, nRead, nExtra, wokeAt5
 *
 * Targets, table habit_targets:
 *   id INTEGER PK, field TEXT, value INTEGER, effectiveFrom TEXT (YYYY-MM-DD)
 *   One row per "change" — the value in effect for a given date is the
 *   most recent row with effectiveFrom <= that date (see index.html
 *   getTargetForDate). UNIQUE(field, effectiveFrom) so re-saving the
 *   same field+date overwrites instead of duplicating.
 *
 * Settings, table habit_settings:
 *   Single-row table (id fixed at 1) holding the whole settings object
 *   as a JSON string in `data`. index.html reads/writes it wholesale —
 *   there's only ever one row, so it's the same settings on every device.
 *
 * MERGE NOTE: an AI rewrite of this file existed (using a `habit_days`
 * table instead of `habits`, and dropping CORS + validation/clamping).
 * It was NOT merged in — `habit_days` is empty/unused, all your real
 * day data lives in `habits`, and the old validation is worth keeping.
 * This is the original, unchanged aside from this note.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PIP_MAX = 3;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function clampCounter(n) {
  n = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(0, n);
}

function clampPip(n) {
  n = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(0, Math.min(PIP_MAX, n));
}

/* ── targets sub-handlers ── */

async function getTargets(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, field, value, effectiveFrom FROM habit_targets ORDER BY effectiveFrom ASC'
  ).all();
  return json(results);
}

async function postTarget(request, env) {
  const t = await request.json();
  if (!t.field || typeof t.value === 'undefined' || !t.effectiveFrom) {
    return json({ error: 'Missing field, value, or effectiveFrom' }, 400);
  }
  const value = clampCounter(t.value);

  await env.DB.prepare(`
    INSERT INTO habit_targets (field, value, effectiveFrom)
    VALUES (?, ?, ?)
    ON CONFLICT(field, effectiveFrom) DO UPDATE SET
      value = excluded.value
  `).bind(t.field, value, t.effectiveFrom).run();

  return json({ ok: true });
}

async function deleteTarget(url, env) {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM habit_targets WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

/* ── settings sub-handlers ── */

async function getSettings(env) {
  const row = await env.DB.prepare('SELECT data FROM habit_settings WHERE id = 1').first();
  if (!row) return json(null);
  try {
    return json(JSON.parse(row.data));
  } catch {
    return json(null);
  }
}

async function postSettings(request, env) {
  const s = await request.json();
  if (!s || typeof s !== 'object' || Array.isArray(s)) {
    return json({ error: 'Settings payload must be a JSON object' }, 400);
  }
  await env.DB.prepare(`
    INSERT INTO habit_settings (id, data) VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data
  `).bind(JSON.stringify(s)).run();
  return json({ ok: true });
}

/* ── birthdays sub-handlers ── */

async function getBirthdays(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, month, day, year, repeatYearly FROM habit_birthdays ORDER BY month ASC, day ASC'
  ).all();
  return json(results);
}

async function postBirthday(request, env) {
  const b = await request.json();
  if (!b.name || !b.month || !b.day) {
    return json({ error: 'Missing name, month, or day' }, 400);
  }
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO habit_birthdays (id, name, month, day, year, repeatYearly)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    b.name,
    b.month,
    b.day,
    b.year ?? null,
    b.repeatYearly === false ? 0 : 1
  ).run();
  return json({ ok: true, id });
}

async function deleteBirthday(url, env) {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM habit_birthdays WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

/* ── GET: habits, or targets if ?resource=targets ── */
async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('resource') === 'targets') {
      return await getTargets(env);
    }
    if (url.searchParams.get('resource') === 'settings') {
      return await getSettings(env);
    }
    if (url.searchParams.get('resource') === 'birthdays') {
      return await getBirthdays(env);
    }

    const { results } = await env.DB.prepare('SELECT * FROM habits').all();
    const out = {};
    for (const row of results) {
      out[row.date] = {
        date:  row.date,
        title: row.title ?? '',

        pushupsCount:        clampCounter(row.pushupsCount),
        readPagesCount:      clampCounter(row.readPagesCount),
        pullupsCount:        clampCounter(row.pullupsCount),
        oneHandPushupsCount: clampCounter(row.oneHandPushupsCount),
        breathHoldSeconds:   clampCounter(row.breathHoldSeconds),

        stretchPips:    clampPip(row.stretchPips),
        lSitPips:       clampPip(row.lSitPips),
        productivePips: clampPip(row.productivePips),
        cardTrickPips:  clampPip(row.cardTrickPips),

        wokeAt5:  !!row.wokeAt5,
        nDay:     row.nDay   ?? '',
        nRead:    row.nRead  ?? '',
        nExtra:   row.nExtra ?? '',
      };
    }
    return json(out);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ── POST: upsert a habit entry, or a target if ?resource=targets ── */
async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('resource') === 'targets') {
      return await postTarget(request, env);
    }
    if (url.searchParams.get('resource') === 'settings') {
      return await postSettings(request, env);
    }
    if (url.searchParams.get('resource') === 'birthdays') {
      return await postBirthday(request, env);
    }

    const t = await request.json();
    if (!t.date) return json({ error: 'Missing date' }, 400);

    const pushupsCount        = clampCounter(t.pushupsCount);
    const readPagesCount      = clampCounter(t.readPagesCount);
    const pullupsCount        = clampCounter(t.pullupsCount);
    const oneHandPushupsCount = clampCounter(t.oneHandPushupsCount);
    const breathHoldSeconds   = clampCounter(t.breathHoldSeconds);

    const stretchPips    = clampPip(t.stretchPips);
    const lSitPips       = clampPip(t.lSitPips);
    const productivePips = clampPip(t.productivePips);
    const cardTrickPips  = clampPip(t.cardTrickPips);

    await env.DB.prepare(`
      INSERT INTO habits (
        date, title,
        pushupsCount, readPagesCount, pullupsCount, oneHandPushupsCount, breathHoldSeconds,
        stretchPips, lSitPips, productivePips, cardTrickPips,
        wokeAt5,
        nDay, nRead, nExtra
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        title               = excluded.title,
        pushupsCount        = excluded.pushupsCount,
        readPagesCount      = excluded.readPagesCount,
        pullupsCount        = excluded.pullupsCount,
        oneHandPushupsCount = excluded.oneHandPushupsCount,
        breathHoldSeconds   = excluded.breathHoldSeconds,
        stretchPips         = excluded.stretchPips,
        lSitPips            = excluded.lSitPips,
        productivePips      = excluded.productivePips,
        cardTrickPips       = excluded.cardTrickPips,
        wokeAt5             = excluded.wokeAt5,
        nDay                = excluded.nDay,
        nRead               = excluded.nRead,
        nExtra              = excluded.nExtra
    `).bind(
      t.date,
      t.title ?? '',
      pushupsCount,
      readPagesCount,
      pullupsCount,
      oneHandPushupsCount,
      breathHoldSeconds,
      stretchPips,
      lSitPips,
      productivePips,
      cardTrickPips,
      t.wokeAt5 ? 1 : 0,
      t.nDay   ?? '',
      t.nRead  ?? '',
      t.nExtra ?? '',
    ).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ── DELETE: only used for ?resource=targets&id=... ── */
async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('resource') === 'targets') {
      return await deleteTarget(url, env);
    }
    if (url.searchParams.get('resource') === 'birthdays') {
      return await deleteBirthday(url, env);
    }
    return json({ error: 'Not supported' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: live  (/api/live) ================================
const M_live = (() => {
// functions/api/live.js  ->  /api/live   (the "live feed": the open site asks every few seconds "did Claude change something?")
//   GET /api/live              -> { last }                      (where the log is now; the page remembers it)
//   GET /api/live?since=12     -> { last, changes: [ { id, ts, kind, date, label, data } ] }   (everything newer than id 12)
// The log (table live_changes) is written by the Claude connector (the MCP section) after every change it makes.
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
let ready = null;
const ensure = (db) => ready || (ready = db.prepare('CREATE TABLE IF NOT EXISTS live_changes (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, kind TEXT, date TEXT, label TEXT, data TEXT)').run().catch((e) => { ready = null; throw e; }));
async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return json({ last: 0, changes: [] });
  try {
    await ensure(db);
    const raw = new URL(request.url).searchParams.get('since');
    const since = raw === null ? NaN : parseInt(raw, 10);
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) AS m FROM live_changes').first();
    const last = row ? row.m : 0;
    if (!(since >= 0)) return json({ last, changes: [] });
    if (since > last) return json({ last, changes: [], reset: true });
    if (since === last) return json({ last, changes: [] });
    const { results } = await db.prepare('SELECT id, ts, kind, date, label, data FROM live_changes WHERE id > ? ORDER BY id LIMIT 20').bind(since).all();
    return json({ last, changes: results.map((r) => { let d = {}; try { d = JSON.parse(r.data); } catch (e) {} return { id: r.id, ts: r.ts, kind: r.kind, date: r.date, label: r.label, data: d }; }) });
  } catch (e) { return json({ last: 0, changes: [], error: 'live feed unavailable' }); }
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: money-scan  (/api/money-scan) ================================
const M_money_scan = (() => {
// Cloudflare Pages Function: /api/money-scan
// Needs a secret named GROQ_API_KEY. Optional var GROQ_MODEL (default below).
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

async function onRequestPost({ request, env }) {
  if (!env.GROQ_API_KEY) return json({ error: 'GROQ_API_KEY not set' }, 500);
  const { image, today } = await request.json();
  if (!image || !image.startsWith('data:image/')) return json({ error: 'image required' }, 400);

  const prompt = `Extract every money transaction visible in this screenshot (bank/app/receipt/calendar).
Today's date is ${today}. If a date has no year, assume the year that makes it the most recent past date.
Return ONLY JSON: {"entries":[{"date":"YYYY-MM-DD","amount":number,"note":"short label"}]}
Rules: money spent/leaving = NEGATIVE amount, money received = POSITIVE. Amounts in euros as plain numbers (12.50, not "€12,50"). Skip totals and balances. If nothing is found return {"entries":[]}.`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.GROQ_API_KEY },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'qwen/qwen3.6-27b',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: image } }
      ] }]
    })
  });
  if (!r.ok) return json({ error: 'Groq error ' + r.status, detail: (await r.text()).slice(0, 300) }, 502);

  const data = await r.json();
  let text = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '');
  const m = text.match(/\{[\s\S]*\}/);
  let entries = [];
  try { entries = JSON.parse(m ? m[0] : '{}').entries || []; } catch (e) {}
  entries = entries
    .filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(Number(e.amount)))
    .map(e => ({ date: e.date, amount: Number(e.amount), note: String(e.note || '').slice(0, 200) }));
  return json({ entries });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: money  (/api/money) ================================
const M_money = (() => {
// functions/api/money.js  ->  /api/money   (uses your D1 binding named DB)
//
// Faster than before:
//  - the table/columns/index are set up ONCE per worker instance, not on every request
//  - GET can ask for just one month:  /api/money?month=2026-10   (uses an index on date)
//  - one round trip per request

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const COLS = 'id, date, amount, note, source, store, street, item, created_at';
const EXTRA = ['store', 'street', 'item']; // structured fields for the day popup

let schemaReady = null;
function ensureSchema(db) {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.prepare(`CREATE TABLE IF NOT EXISTS money_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
    const { results } = await db.prepare('PRAGMA table_info(money_entries)').all();
    const have = new Set(results.map((r) => r.name));
    for (const c of EXTRA) {
      if (!have.has(c)) await db.prepare(`ALTER TABLE money_entries ADD COLUMN ${c} TEXT DEFAULT ''`).run();
    }
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_money_date ON money_entries(date)').run();
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);
  try { await ensureSchema(db); } catch (e) { return json({ error: 'schema: ' + e.message }, 500); }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const month = url.searchParams.get('month'); // YYYY-MM
    let stmt;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      stmt = db.prepare(`SELECT ${COLS} FROM money_entries WHERE date >= ? AND date <= ? ORDER BY date, id`)
        .bind(month + '-01', month + '-31');
    } else {
      stmt = db.prepare(`SELECT ${COLS} FROM money_entries ORDER BY date, id`);
    }
    const { results } = await stmt.all();
    return json({ entries: results });
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }
    const rows = (Array.isArray(body) ? body : [body]).filter(
      (r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(Number(r.amount))
    );
    if (!rows.length) return json({ error: 'no valid rows' }, 400);
    const stmt = db.prepare(
      'INSERT INTO money_entries (date, amount, note, source, store, street, item) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    await db.batch(rows.map((r) => stmt.bind(
      r.date, Number(r.amount), String(r.note || '').slice(0, 200), r.source || 'manual',
      String(r.store || '').slice(0, 120), String(r.street || '').slice(0, 150), String(r.item || '').slice(0, 200)
    )));
    return json({ ok: true, added: rows.length });
  }

  if (request.method === 'DELETE') {
    const id = Number(url.searchParams.get('id'));
    if (!id) return json({ error: 'id required' }, 400);
    await db.prepare('DELETE FROM money_entries WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: push-check  (/api/push-check) ================================
const M_push_check = (() => {
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function zonedTimeToUtc(y, mo, d, h, mi, timeZone) {
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcGuess));
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const hour = map.hour === '24' ? '0' : map.hour;
  const asUtc = Date.UTC(
    parseInt(map.year), parseInt(map.month) - 1, parseInt(map.day),
    parseInt(hour), parseInt(map.minute), parseInt(map.second)
  );
  const offset = asUtc - utcGuess;
  return utcGuess - offset;
}

function b64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBytes(...arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

async function hmacSha256(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return new Uint8Array(sig);
}

async function hkdf(salt, ikm, info, length) {
  const prk = await hmacSha256(salt, ikm);
  let t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  let counter = 1;
  while (okm.length < length) {
    const input = concatBytes(t, info, new Uint8Array([counter]));
    t = await hmacSha256(prk, input);
    okm = concatBytes(okm, t);
    counter++;
  }
  return okm.slice(0, length);
}

async function createVapidAuthHeader(endpoint, publicKeyB64, privateKeyB64, subject) {
  const pubBytes = b64urlToBytes(publicKeyB64);
  const x = pubBytes.slice(1, 33);
  const y = pubBytes.slice(33, 65);
  const d = b64urlToBytes(privateKeyB64);

  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: bytesToB64url(x), y: bytesToB64url(y), d: bytesToB64url(d),
    ext: true,
  };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

  const aud = new URL(endpoint).origin;
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject };

  const encHeader = bytesToB64url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${encHeader}.${encPayload}`;

  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${bytesToB64url(new Uint8Array(sigBuf))}`;

  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

async function encryptPayload(payloadText, p256dhB64, authB64) {
  const enc = new TextEncoder();
  const payload = enc.encode(payloadText);

  const receiverPublicBytes = b64urlToBytes(p256dhB64);
  const authSecret = b64urlToBytes(authB64);
  const receiverX = receiverPublicBytes.slice(1, 33);
  const receiverY = receiverPublicBytes.slice(33, 65);

  const receiverKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: bytesToB64url(receiverX), y: bytesToB64url(receiverY), ext: true },
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const localPublicJwk = await crypto.subtle.exportKey('jwk', localKeyPair.publicKey);
  const localPublicBytes = concatBytes(
    new Uint8Array([0x04]),
    b64urlToBytes(localPublicJwk.x),
    b64urlToBytes(localPublicJwk.y)
  );

  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverKey }, localKeyPair.privateKey, 256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const authInfo = concatBytes(enc.encode('WebPush: info\0'), receiverPublicBytes, localPublicBytes);
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);

  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const padded = concatBytes(payload, new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, padded)
  );

  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicBytes.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs, false);
  header[20] = localPublicBytes.length;
  header.set(localPublicBytes, 21);

  return concatBytes(header, ciphertext);
}

function pad(n) { return String(n).padStart(2, '0'); }

const MONTH_NAMES = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

// Today's Y/M/D as seen in the given timezone right now — used to know
// which habit_birthdays rows count as "today" and to find local midnight.
function todayInTZ(timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const map = {};
  for (const p of dtf.formatToParts(new Date())) map[p.type] = p.value;
  return { y: parseInt(map.year), mo: parseInt(map.month), d: parseInt(map.day) };
}

async function sendPush(sub, payloadObj, env) {
  const body = await encryptPayload(JSON.stringify(payloadObj), sub.p256dh, sub.auth);
  const authorization = await createVapidAuthHeader(
    sub.endpoint, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT
  );
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '60',
      'Authorization': authorization,
    },
    body,
  });
}

async function onRequestGet({ env }) {
  try {
    const nowMs = Date.now();

    // ── due events (unchanged) ──
    const { results } = await env.DB.prepare(
      'SELECT * FROM habit_events WHERE notify = 1'
    ).all();

    const due = [];
    for (const ev of results) {
      const [y, mo, d] = ev.dateKey.split('-').map(Number);
      const hh = Math.floor(ev.startMinutes / 60);
      const mi = ev.startMinutes % 60;
      // tests/projects made by the Test tab (ids mdtest-/mdproj-) notify ONE DAY BEFORE, at the same clock time
      ev.isAuto = /^md(test|proj)-/.test(String(ev.id || ''));
      const eventMs = zonedTimeToUtc(y, mo, ev.isAuto ? d - 1 : d, hh, mi, 'Europe/Vilnius');
      if (eventMs <= nowMs && eventMs > nowMs - 90 * 1000) {
        ev.timeLabel = `${pad(hh)}:${pad(mi)}`;
        due.push(ev);
      }
    }

    let toSend = [];
    if (due.length) {
      const placeholders = due.map(() => '?').join(',');
      const { results: alreadySentRows } = await env.DB.prepare(
        `SELECT event_id FROM sent_notifications WHERE event_id IN (${placeholders})`
      ).bind(...due.map((e) => e.id)).all();
      const sentIds = new Set(alreadySentRows.map((r) => r.event_id));
      toSend = due.filter((e) => !sentIds.has(e.id));
    }

    // ── due birthdays — fire once, at local (Europe/Vilnius) midnight ──
    // sent_notifications is shared with events; birthdays use a
    // "birthday-<id>-<year>" key so the same person can fire again next
    // year without colliding with this year's row (or with event ids).
    const { y: ty, mo: tmo, d: td } = todayInTZ('Europe/Vilnius');
    const midnightMs = zonedTimeToUtc(ty, tmo, td, 0, 0, 'Europe/Vilnius');
    const inMidnightWindow = nowMs >= midnightMs && nowMs < midnightMs + 90 * 1000;

    let dueBirthdays = [];
    if (inMidnightWindow) {
      const { results: birthdays } = await env.DB.prepare(
        'SELECT * FROM habit_birthdays WHERE month = ? AND day = ?'
      ).bind(tmo, td).all();
      const candidates = birthdays.filter((b) => b.repeatYearly !== 0 || b.year === ty);

      if (candidates.length) {
        const bKeys = candidates.map((b) => `birthday-${b.id}-${ty}`);
        const bPlaceholders = bKeys.map(() => '?').join(',');
        const { results: alreadySentB } = await env.DB.prepare(
          `SELECT event_id FROM sent_notifications WHERE event_id IN (${bPlaceholders})`
        ).bind(...bKeys).all();
        const sentBKeys = new Set(alreadySentB.map((r) => r.event_id));
        dueBirthdays = candidates.filter((b) => !sentBKeys.has(`birthday-${b.id}-${ty}`));
      }
    }

    if (!toSend.length && !dueBirthdays.length) return json({ ok: true, sent: 0 });

    const { results: subs } = await env.DB.prepare('SELECT * FROM push_subscriptions').all();

    let sentCount = 0;
    const markStmts = [];

    for (const ev of toSend) {
      const payload = ev.isAuto
        ? { title: 'Tomorrow: ' + (ev.type || 'Test'), body: ev.description || ev.dateKey }
        : {
        title: ev.type || 'Reminder',
        body: ev.description ? `${ev.timeLabel} — ${ev.description}` : ev.timeLabel,
      };
      for (const sub of subs) {
        try {
          const res = await sendPush(sub, payload, env);
          if (res.status === 404 || res.status === 410) {
            await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
          } else {
            sentCount++;
          }
        } catch (err) {
          /* one bad subscription shouldn't block the rest */
        }
      }
      markStmts.push(
        env.DB.prepare('INSERT OR REPLACE INTO sent_notifications (event_id, sent_at) VALUES (?, ?)')
          .bind(ev.id, Date.now())
      );
    }

    for (const b of dueBirthdays) {
      const payload = { title: b.name, body: `${MONTH_NAMES[b.month - 1]} ${b.day}` };
      for (const sub of subs) {
        try {
          const res = await sendPush(sub, payload, env);
          if (res.status === 404 || res.status === 410) {
            await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
          } else {
            sentCount++;
          }
        } catch (err) {
          /* one bad subscription shouldn't block the rest */
        }
      }
      markStmts.push(
        env.DB.prepare('INSERT OR REPLACE INTO sent_notifications (event_id, sent_at) VALUES (?, ?)')
          .bind(`birthday-${b.id}-${ty}`, Date.now())
      );
    }

    if (markStmts.length) await env.DB.batch(markStmts);

    return json({ ok: true, sent: sentCount });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: push-subscribe  (/api/push-subscribe) ================================
const M_push_subscribe = (() => {
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function onRequestPost({ request, env }) {
  try {
    const sub = await request.json();
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return json({ error: 'Bad subscription payload' }, 400);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `).bind(id, sub.endpoint, sub.keys.p256dh, sub.keys.auth, Date.now()).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: spend  (/api/spend) ================================
const M_spend = (() => {
// functions/api/spend.js  ->  https://bens-calendar.pages.dev/api/spend
// Apple Pay (iOS Shortcuts) -> money_entries, with structured fields:
//   POST { amount, merchant }          saves the payment (store = merchant)
//   PUT  { id, street, item }          adds the street + what you bought afterwards
//        (old shortcuts that send { id, note } still work: the text is stored as "item")
//
// Needs in Cloudflare Pages -> Settings -> Variables and Secrets:
//   SPEND_TOKEN  (secret) — same value as after "Bearer " in the Shortcut
// Uses the same D1 binding as money.js: DB

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const authed = (request, env) =>
  Boolean(env.SPEND_TOKEN) && (request.headers.get('Authorization') || '') === `Bearer ${env.SPEND_TOKEN}`;

// "€5.40", "5,40 €", "-12.00", "1,234.50" -> number
function parseAmount(raw) {
  let s = String(raw ?? '').replace(/[^\d.,-]/g, '');
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Math.abs(parseFloat(s));
  return Number.isFinite(n) ? n : NaN;
}

let schemaReady = null;
function ensureSchema(db) {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.prepare(`CREATE TABLE IF NOT EXISTS money_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
    const { results } = await db.prepare('PRAGMA table_info(money_entries)').all();
    const have = new Set(results.map((r) => r.name));
    for (const c of ['store', 'street', 'item']) {
      if (!have.has(c)) await db.prepare(`ALTER TABLE money_entries ADD COLUMN ${c} TEXT DEFAULT ''`).run();
    }
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_money_date ON money_entries(date)').run();
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

async function onRequestPost({ request, env }) {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401);
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }

  const amount = parseAmount(body.amount);
  if (!(amount > 0)) return json({ error: 'bad amount', got: body.amount }, 400);

  const store = String(body.merchant ?? '').trim().slice(0, 120);
  const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vilnius' }); // YYYY-MM-DD

  await ensureSchema(db);
  const res = await db
    .prepare('INSERT INTO money_entries (date, amount, note, source, store) VALUES (?, ?, ?, ?, ?)')
    .bind(date, -amount, store || 'Apple Pay', 'apple pay', store)
    .run();

  return json({ ok: true, id: res.meta?.last_row_id, date, amount: -amount, store });
}

async function onRequestPut({ request, env }) {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401);
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }

  const id = Number(body.id);
  let street = String(body.street ?? '').trim().slice(0, 150);
  let item = String(body.item ?? '').trim().slice(0, 200);
  if (!street && !item && body.note) item = String(body.note).trim().slice(0, 200); // old shortcut format
  if (!id || (!street && !item)) return json({ error: 'id and street/item required' }, 400);

  await ensureSchema(db);
  const res = await db
    .prepare("UPDATE money_entries SET street = ?, item = ? WHERE id = ? AND source = 'apple pay'")
    .bind(street, item, id)
    .run();

  if (!res.meta?.changes) return json({ error: 'entry not found' }, 404);
  return json({ ok: true, id });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: talk-ai  (/api/talk-ai) ================================
const M_talk_ai = (() => {
/**
 * POST /api/talk-ai
 * Body: { transcript: string, nowISO: string, existingEvents?: { [dateKey]: EventContext[] } }
 * Returns: { items: [ EventItem | EventEditItem | HabitItem, ... ] }
 *
 *   EventItem: { kind:"event", dateKey, title, description, color, startMinutes, durationMinutes }
 *   EventEditItem: { kind:"event_edit", id, dateKey, [title], [description], [color],
 *                     [locked], [notify], [startMinutes], [durationMinutes] }
 *     - `id` must be one of the ids the client sent in `existingEvents` — the model can
 *       never invent one, and `dateKey` is taken from wherever the client's own data says
 *       that id actually lives (the model's guess at dateKey is ignored for this kind).
 *     - Every other field is OPTIONAL — only the ones the transcript actually asked to
 *       change should be present; anything omitted is left as-is on the client.
 *   EventDeleteItem: { kind:"event_delete", id, dateKey }
 *     - Same `id`/`dateKey` resolution rule as EventEditItem: id must be one the client
 *       already sent, dateKey is resolved server-side from that id, never from the model.
 *   HabitItem: { kind:"habit", dateKey, field, op:"delta"|"set", value }
 *     - counter/pip fields (pushupsCount, readPagesCount, pullupsCount,
 *       oneHandPushupsCount, breathHoldSeconds, stretchPips, lSitPips,
 *       productivePips, cardTrickPips) use op:"delta" with a numeric value
 *       (e.g. "did 50 pushups" -> {field:"pushupsCount", op:"delta", value:50})
 *     - wokeAt5 uses op:"set" with a boolean value
 *     - free-text fields (nDay, nRead, nExtra, title) use op:"set" with a string
 *
 * Takes a raw speech transcript that may describe several things across
 * several days — timed/plannable activities ("dinner at 7", "meeting
 * tomorrow at 3") become new events; tally/checkbox things tied to the
 * day itself ("did 50 pushups", "read today", "woke up at 5") become
 * habit updates; and references to something ALREADY on the calendar
 * ("mark today's gym session green", "lock that meeting", "turn on the
 * alert for dinner") become event_edit items instead of duplicating a
 * new box. Every item is validated/clamped here before it's ever handed
 * back to the client — bad or missing fields, or an edit pointing at an
 * id the client never actually sent, never reach either /api/events or
 * /api/habits.
 *
 * Requires:
 *   GROQ_API_KEY — set in Pages → Settings → Variables and Secrets.
 *
 * This is read-only with respect to D1 — it never touches the DB
 * itself. Habit deltas are returned as deltas, not absolute values;
 * the client merges them against its own in-memory habitsData (it
 * already has the current values loaded) before POSTing to
 * /api/habits. `existingEvents` is likewise just context the client
 * already had loaded (from EventStore) — this function never reads or
 * writes anything itself. Neither /api/events nor /api/habits are
 * modified here.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const GROQ_MODEL = 'openai/gpt-oss-120b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Must match EventEditor's COLOR_SWATCHES in index.html — anything
// outside this list gets coerced to the first (blue) default.
const VALID_COLORS = [
  '#3b82f6', '#e6362a', '#f59e0b', '#10b981', '#14b8a6',
  '#8b5cf6', '#ec4899', '#64748b', '#78350f', '#111827',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Mirrors the field model documented at the top of functions/api/habits.js
// and the FIELD_CONFIG list in index.html.
const COUNTER_FIELDS = ['pushupsCount', 'readPagesCount', 'pullupsCount', 'oneHandPushupsCount', 'breathHoldSeconds'];
const PIP_FIELDS = ['stretchPips', 'lSitPips', 'productivePips', 'cardTrickPips'];
const BOOL_FIELDS = ['wokeAt5'];
const TEXT_FIELDS = ['nDay', 'nRead', 'nExtra', 'title'];

// How many existing-event entries we'll ever fold into the prompt.
// The client should already be sending a reasonably-scoped window
// (see gatherExistingEventsContext in index.html), this is just a
// hard backstop against a runaway prompt if it ever isn't.
const MAX_EXISTING_EVENTS = 250;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function clampMinutes(n, fallback) {
  n = Number(n);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1439, Math.trunc(n)));
}

function clampDuration(n, fallback) {
  n = Number(n);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.max(5, Math.min(1440, Math.trunc(n)));
}

// Turns the client-supplied existingEvents map into (a) a compact,
// token-cheap text block for the prompt and (b) an id -> dateKey
// lookup so validateEventEdit can authoritatively resolve dateKey
// itself rather than trusting whatever the model echoes back.
function summarizeExistingEvents(existingEvents) {
  const idToDateKey = new Map();
  const lines = [];
  if (!existingEvents || typeof existingEvents !== 'object') {
    return { lines, idToDateKey };
  }

  let count = 0;
  for (const dateKey of Object.keys(existingEvents).sort()) {
    if (!DATE_RE.test(dateKey)) continue;
    const list = Array.isArray(existingEvents[dateKey]) ? existingEvents[dateKey] : [];
    for (const ev of list) {
      if (count >= MAX_EXISTING_EVENTS) break;
      const id = typeof ev?.id === 'string' ? ev.id : null;
      if (!id) continue;
      idToDateKey.set(id, dateKey);
      const title = (typeof ev.title === 'string' && ev.title.trim()) ? ev.title.trim().slice(0, 60) : '(untitled)';
      const start = Number.isFinite(ev.startMinutes) ? ev.startMinutes : 0;
      const dur = Number.isFinite(ev.durationMinutes) ? ev.durationMinutes : 0;
      const hh = String(Math.floor(start / 60)).padStart(2, '0');
      const mm = String(start % 60).padStart(2, '0');
      const flags = [ev.locked ? 'locked' : null, ev.notify ? 'alert-on' : null].filter(Boolean).join(',');
      lines.push(
        `id=${id} date=${dateKey} time=${hh}:${mm}+${dur}m color=${ev.color || VALID_COLORS[0]}` +
        (flags ? ` [${flags}]` : '') + ` title="${title}"`
      );
      count++;
    }
    if (count >= MAX_EXISTING_EVENTS) break;
  }
  return { lines, idToDateKey };
}

function buildPrompt(transcript, nowISO, existingEventLines) {
  const existingBlock = existingEventLines.length
    ? '\n\nEXISTING EVENTS ALREADY ON THE CALENDAR (for matching edits ONLY — never invent an ' +
      'id that isn\'t listed here, and never repeat one of these back as a brand-new "event" ' +
      'item, that would create a duplicate box):\n' + existingEventLines.join('\n')
    : '\n\n(No existing events were provided as context, so nothing can be edited this turn — ' +
      'treat every timed/plannable thing as a new event.)';

  return [
    {
      role: 'system',
      content:
        'You convert a spoken diary/planning transcript into structured updates for a habit-tracking ' +
        'calendar app. The current date/time (ISO, already in the user\'s local zone) is: ' + nowISO + '. ' +
        'The transcript may mix several different kinds of things, across multiple days (yesterday, today, ' +
        'tomorrow, "at 15", "before bed"):\n\n' +
        '1. NEW EVENTS — timed/plannable things that are not already on the calendar ("dinner at 7", ' +
        '"meeting tomorrow at 3", "went to the gym at noon"). Emit: {"kind":"event","dateKey":"YYYY-MM-DD",' +
        '"title":short string,"description":short first-person string,"color":one of [' + VALID_COLORS.join(', ') +
        '] (pick ' + VALID_COLORS[1] + ' for wasted/guilty/unproductive, ' + VALID_COLORS[3] + ' or ' + VALID_COLORS[4] +
        ' for productive/positive/completed, ' + VALID_COLORS[0] + ' as neutral default),' +
        '"startMinutes":integer 0-1439 (minutes since midnight),"durationMinutes":integer (best reasonable guess if unstated)}.\n\n' +
        '2. EDITS TO AN EXISTING EVENT — the transcript refers to something already on the calendar (see the ' +
        'list below) rather than describing something brand new. Common triggers: "I just finished X" / "I just ' +
        'did X" (usually means: mark it done, e.g. turn it ' + VALID_COLORS[3] + ' or ' + VALID_COLORS[4] +
        ' green), "mark X as done/complete", "lock that", "turn on/off the alert for X", "rename X to Y", ' +
        '"move X to 15", "make X an hour instead". Emit: {"kind":"event_edit","id":"<id copied EXACTLY from the ' +
        'list below>","dateKey":"YYYY-MM-DD" (copy the date next to that id), plus ONLY the fields that are ' +
        'actually changing, any subset of: "title":string, "description":string, "color":one of [' +
        VALID_COLORS.join(', ') + '], "locked":boolean, "notify":boolean, "startMinutes":integer 0-1439, ' +
        '"durationMinutes":integer}. Do not include a field you\'re not changing. If you cannot confidently ' +
        'match the reference to one specific id from the list, do NOT guess — either skip it entirely or, if ' +
        'it more plausibly describes something new, emit it as a new "event" instead.\n\n' +
        '3. HABIT/CHECKLIST UPDATES — tally or checkbox things tied to the day itself, not a specific clock ' +
        'time ("did 50 pushups", "read today", "woke up at 5", "stretched"). Emit: {"kind":"habit",' +
        '"dateKey":"YYYY-MM-DD","field":one of [' + COUNTER_FIELDS.concat(PIP_FIELDS).concat(BOOL_FIELDS).concat(TEXT_FIELDS).join(', ') +
        '],"op":"delta" for the counter/pip fields (' + COUNTER_FIELDS.concat(PIP_FIELDS).join(', ') +
        ') with a numeric "value" (e.g. did 50 pushups -> value:50), or "op":"set" for wokeAt5 with a boolean ' +
        '"value", or "op":"set" for the free-text fields (' + TEXT_FIELDS.join(', ') + ') with a short string "value"}.\n\n' +
        '4. DELETE AN EXISTING EVENT — the transcript asks to remove/cancel/get rid of something already on ' +
        'the calendar (see the list below) rather than change one of its fields. Common triggers: "delete X", ' +
        '"cancel X", "remove X", "get rid of the Y meeting", "never mind about X, take it off". Emit: ' +
        '{"kind":"event_delete","id":"<id copied EXACTLY from the list below>","dateKey":"YYYY-MM-DD" (copy ' +
        'the date next to that id)}. If you cannot confidently match the reference to one specific id from the ' +
        'list, do NOT guess — skip it entirely rather than deleting the wrong thing.' +
        existingBlock + '\n\n' +
        'Resolve every relative date/time against the current date/time given above. Respond with ONLY a raw ' +
        'JSON array (no markdown, no prose, no code fences) mixing any of the four kinds as needed. If duration ' +
        'or exact time for a new event isn\'t stated, make a sensible guess rather than omitting it. Never invent ' +
        'things that weren\'t mentioned, and never invent an id. If nothing describable is found, return [].',
    },
    { role: 'user', content: transcript },
  ];
}

function parseModelOutput(text) {
  let cleaned = String(text || '').trim();
  // Strip accidental code fences even though the prompt asks against them.
  cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    throw new Error('not an array');
  } catch {
    // Groq occasionally prefaces the array with a sentence or two
    // despite instructions not to. Fall back to extracting the first
    // balanced [...] span rather than failing the whole request.
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Model did not return a JSON array');
    }
    const sliced = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(sliced);
    if (!Array.isArray(parsed)) throw new Error('Model did not return a JSON array');
    return parsed;
  }
}

function validateEvent(raw, fallbackDateKey) {
  const dateKey = DATE_RE.test(raw.dateKey) ? raw.dateKey : fallbackDateKey;
  const title = (typeof raw.title === 'string' && raw.title.trim()) ? raw.title.trim().slice(0, 60) : 'Event';
  const description = (typeof raw.description === 'string') ? raw.description.trim().slice(0, 300) : '';
  const color = VALID_COLORS.includes(raw.color) ? raw.color : VALID_COLORS[0];
  const startMinutes = clampMinutes(raw.startMinutes, 0);
  const durationMinutes = clampDuration(raw.durationMinutes, 30);

  return { kind: 'event', dateKey, title, description, color, startMinutes, durationMinutes };
}

// Unlike validateEvent, every field except id/dateKey is OPTIONAL —
// only fields actually present (and valid) end up on the returned
// item, so the client knows to leave everything else untouched.
// `dateKey` is never taken from the model; it's resolved from
// idToDateKey (built server-side from what the client actually sent)
// so a hallucinated or mismatched dateKey can't misroute the edit.
function validateEventEdit(raw, idToDateKey) {
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id || !idToDateKey.has(id)) return null; // must reference a real, client-provided event
  const dateKey = idToDateKey.get(id);

  const out = { kind: 'event_edit', id, dateKey };
  let changed = false;

  if (typeof raw.title === 'string' && raw.title.trim()) {
    out.title = raw.title.trim().slice(0, 60);
    changed = true;
  }
  if (typeof raw.description === 'string') {
    out.description = raw.description.trim().slice(0, 300);
    changed = true;
  }
  if (raw.color !== undefined && VALID_COLORS.includes(raw.color)) {
    out.color = raw.color;
    changed = true;
  }
  if (typeof raw.locked === 'boolean') {
    out.locked = raw.locked;
    changed = true;
  }
  if (typeof raw.notify === 'boolean') {
    out.notify = raw.notify;
    changed = true;
  }
  if (raw.startMinutes !== undefined) {
    const m = clampMinutes(raw.startMinutes, null);
    if (m !== null) { out.startMinutes = m; changed = true; }
  }
  if (raw.durationMinutes !== undefined) {
    const d = clampDuration(raw.durationMinutes, null);
    if (d !== null) { out.durationMinutes = d; changed = true; }
  }

  return changed ? out : null; // no-op edits (nothing recognized/valid) are dropped
}

function validateHabit(raw, fallbackDateKey) {
  const dateKey = DATE_RE.test(raw.dateKey) ? raw.dateKey : fallbackDateKey;
  const field = raw.field;

  if (COUNTER_FIELDS.includes(field) || PIP_FIELDS.includes(field)) {
    const value = Number(raw.value);
    if (!Number.isFinite(value) || value === 0) return null;
    // Pips are capped 0-3 total, so an absurd spoken delta (e.g. "50 pips")
    // is still clamped client-side against the real current value — here
    // we just cap the delta itself to a sane range per field type.
    const cap = PIP_FIELDS.includes(field) ? 3 : 1000;
    const clamped = Math.max(-cap, Math.min(cap, Math.trunc(value)));
    return { kind: 'habit', dateKey, field, op: 'delta', value: clamped };
  }

  if (BOOL_FIELDS.includes(field)) {
    return { kind: 'habit', dateKey, field, op: 'set', value: !!raw.value };
  }

  if (TEXT_FIELDS.includes(field)) {
    const value = (typeof raw.value === 'string') ? raw.value.trim().slice(0, 300) : '';
    if (!value) return null;
    return { kind: 'habit', dateKey, field, op: 'set', value };
  }

  return null;
}

// Same id/dateKey resolution rule as validateEventEdit: id must
// already be one the client sent (never invented by the model), and
// dateKey is resolved from idToDateKey rather than trusted from the
// model, so a hallucinated id or mismatched dateKey can't delete the
// wrong thing (or anything at all, since it'll just fail the lookup).
function validateEventDelete(raw, idToDateKey) {
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id || !idToDateKey.has(id)) return null;
  const dateKey = idToDateKey.get(id);
  return { kind: 'event_delete', id, dateKey };
}

function validateItem(raw, fallbackDateKey, idToDateKey) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.kind === 'event') return validateEvent(raw, fallbackDateKey);
  if (raw.kind === 'event_edit') return validateEventEdit(raw, idToDateKey);
  if (raw.kind === 'event_delete') return validateEventDelete(raw, idToDateKey);
  if (raw.kind === 'habit') return validateHabit(raw, fallbackDateKey);
  return null;
}

async function onRequestPost({ request, env }) {
  try {
    if (!env.GROQ_API_KEY) {
      return json({ error: 'Missing GROQ_API_KEY on this Pages project.' }, 500);
    }

    const { transcript, nowISO, existingEvents } = await request.json();
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return json({ error: 'Missing transcript' }, 400);
    }
    const now = nowISO && !isNaN(Date.parse(nowISO)) ? nowISO : new Date().toISOString();
    const fallbackDateKey = now.slice(0, 10);

    const { lines: existingEventLines, idToDateKey } = summarizeExistingEvents(existingEvents);

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: buildPrompt(transcript, now, existingEventLines),
        temperature: 0.2,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      return json({ error: 'Groq request failed: ' + groqRes.status + ' ' + errText.slice(0, 200) }, 502);
    }

    const groqData = await groqRes.json();
    const text = groqData?.choices?.[0]?.message?.content || '[]';

    let rawEvents;
    try {
      rawEvents = parseModelOutput(text);
    } catch {
      return json({ error: 'Could not parse model output', items: [] }, 200);
    }

    const items = rawEvents
      .map((e) => validateItem(e, fallbackDateKey, idToDateKey))
      .filter(Boolean);

    return json({ items });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: test-push  (/api/test-push) ================================
const M_test_push = (() => {
/**
 * POST /api/test-push
 *
 * Debugging / force-send endpoint: sends a push notification to every row in
 * push_subscriptions RIGHT NOW, bypassing all the event-timing logic
 * in push-check.js entirely. Returns a detailed per-subscription
 * report (HTTP status from the push service, or the exact error) so
 * we can see precisely what happens instead of guessing.
 *
 * Uses the exact same VAPID + aes128gcm encryption code as
 * push-check.js (kept duplicated here on purpose — see the MERGE
 * NOTE pattern in the other API files — so this stays a standalone,
 * always-safe-to-hit debug tool that can't accidentally break the
 * real send path).
 *
 * Optional JSON body { title, body } (aliases: subject, text) sends that
 * custom notification instead of the default test message.
 *
 * Requires the same env bindings as push-check.js:
 *   DB, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function b64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBytes(...arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

async function hmacSha256(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return new Uint8Array(sig);
}

async function hkdf(salt, ikm, info, length) {
  const prk = await hmacSha256(salt, ikm);
  let t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  let counter = 1;
  while (okm.length < length) {
    const input = concatBytes(t, info, new Uint8Array([counter]));
    t = await hmacSha256(prk, input);
    okm = concatBytes(okm, t);
    counter++;
  }
  return okm.slice(0, length);
}

async function createVapidAuthHeader(endpoint, publicKeyB64, privateKeyB64, subject) {
  const pubBytes = b64urlToBytes(publicKeyB64);
  const x = pubBytes.slice(1, 33);
  const y = pubBytes.slice(33, 65);
  const d = b64urlToBytes(privateKeyB64);

  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: bytesToB64url(x), y: bytesToB64url(y), d: bytesToB64url(d),
    ext: true,
  };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

  const aud = new URL(endpoint).origin;
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject };

  const encHeader = bytesToB64url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${encHeader}.${encPayload}`;

  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${bytesToB64url(new Uint8Array(sigBuf))}`;

  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

async function encryptPayload(payloadText, p256dhB64, authB64) {
  const enc = new TextEncoder();
  const payload = enc.encode(payloadText);

  const receiverPublicBytes = b64urlToBytes(p256dhB64);
  const authSecret = b64urlToBytes(authB64);
  const receiverX = receiverPublicBytes.slice(1, 33);
  const receiverY = receiverPublicBytes.slice(33, 65);

  const receiverKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: bytesToB64url(receiverX), y: bytesToB64url(receiverY), ext: true },
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const localPublicJwk = await crypto.subtle.exportKey('jwk', localKeyPair.publicKey);
  const localPublicBytes = concatBytes(
    new Uint8Array([0x04]),
    b64urlToBytes(localPublicJwk.x),
    b64urlToBytes(localPublicJwk.y)
  );

  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverKey }, localKeyPair.privateKey, 256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const authInfo = concatBytes(enc.encode('WebPush: info\0'), receiverPublicBytes, localPublicBytes);
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);

  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const padded = concatBytes(payload, new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, padded)
  );

  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicBytes.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs, false);
  header[20] = localPublicBytes.length;
  header.set(localPublicBytes, 21);

  return concatBytes(header, ciphertext);
}

async function sendPush(sub, payloadObj, env) {
  let body;
  try {
    body = await encryptPayload(JSON.stringify(payloadObj), sub.p256dh, sub.auth);
  } catch (err) {
    err.step = 'encryptPayload (receiver p256dh/auth)';
    err.p256dhLen = (() => { try { return b64urlToBytes(sub.p256dh).length; } catch { return 'decode failed'; } })();
    err.authLen = (() => { try { return b64urlToBytes(sub.auth).length; } catch { return 'decode failed'; } })();
    throw err;
  }
  let authorization;
  try {
    authorization = await createVapidAuthHeader(
      sub.endpoint, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT
    );
  } catch (err) {
    err.step = 'createVapidAuthHeader (shared VAPID key)';
    throw err;
  }
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '60',
      'Authorization': authorization,
    },
    body,
  });
}

async function onRequestPost({ request, env }) {
  const report = { ok: true, subscriptions: 0, results: [] };

  // "Force Send" from Settings: optional custom subject/text. A plain
  // test (no body, or empty fields) keeps the default message.
  let custom = {};
  try { custom = await request.json(); } catch { custom = {}; }
  if (!custom || typeof custom !== 'object') custom = {};
  // Push services allow ~4078 bytes of encrypted content in total, so the
  // real limit is measured in BYTES for subject + text together (emoji and
  // accented letters take 2-4 bytes each). Stay safely under it.
  const MAX_PAYLOAD_BYTES = 3900;
  const customTitle = String(custom.title ?? custom.subject ?? '').trim().slice(0, 500);
  let customBody = String(custom.body ?? custom.text ?? '').trim().slice(0, 4000);
  const byteLen = (o) => new TextEncoder().encode(JSON.stringify(o)).length;
  let truncated = false;
  while (customBody && byteLen({ title: customTitle || 'Notification', body: customBody }) > MAX_PAYLOAD_BYTES) {
    customBody = Array.from(customBody).slice(0, Math.max(0, Math.floor(Array.from(customBody).length * 0.95) - 1)).join('');
    truncated = true;
  }
  const isForced = !!(customTitle || customBody);

  try {
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
      return json({
        ok: false,
        error: 'Missing VAPID env vars on this Pages project (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT). ' +
               'These must be set in the Pages project settings, not just the cron worker.',
      }, 500);
    }
    if (!env.DB) {
      return json({ ok: false, error: 'Missing DB binding on this Pages project.' }, 500);
    }

    const { results: subs } = await env.DB.prepare('SELECT * FROM push_subscriptions').all();
    report.subscriptions = subs.length;

    // Sanity-check the VAPID keys themselves before ever touching a
    // subscription — this is the one thing shared across every push,
    // so if it's malformed, every send fails identically regardless
    // of recipient (which is exactly what we're seeing).
    try {
      const pubBytes = b64urlToBytes(env.VAPID_PUBLIC_KEY);
      const privBytes = b64urlToBytes(env.VAPID_PRIVATE_KEY);
      report.vapidCheck = {
        publicKeyDecodedBytes: pubBytes.length,   // must be exactly 65
        publicKeyFirstByteHex: pubBytes.length ? pubBytes[0].toString(16) : null, // must be '4'
        privateKeyDecodedBytes: privBytes.length, // must be exactly 32
        publicKeyRawLength: env.VAPID_PUBLIC_KEY.length,
        privateKeyRawLength: env.VAPID_PRIVATE_KEY.length,
        publicKeyHasWhitespace: /\s/.test(env.VAPID_PUBLIC_KEY),
        privateKeyHasWhitespace: /\s/.test(env.VAPID_PRIVATE_KEY),
      };
    } catch (err) {
      report.vapidCheck = { error: 'Could not even base64-decode the VAPID keys: ' + err.message };
    }

    if (!subs.length) {
      report.ok = false;
      report.error = 'No rows in push_subscriptions at all. That means no device has ever successfully subscribed — ' +
                      'the browser never completed pushManager.subscribe() + POST to /api/push-subscribe, ' +
                      'or every subscription was previously deleted after a 404/410. Toggle the notify bell off ' +
                      'then on for any event to force a fresh subscribe attempt, then try this test again.';
      return json(report);
    }

    const payload = isForced
      ? { title: customTitle || 'Notification', body: customBody }
      : { title: 'Test notification', body: 'If you see this, push delivery works.' };
    report.forced = isForced;
    if (isForced) report.sentPayload = payload;
    if (truncated) report.warning = 'Message was too long for a push (about 3900 bytes max) and was shortened.';

    for (const sub of subs) {
      const entry = { id: sub.id, endpoint: sub.endpoint.slice(0, 60) + '...' };
      try {
        const res = await sendPush(sub, payload, env);
        entry.status = res.status;
        if (res.status === 201 || res.status === 200) {
          entry.result = 'sent';
        } else if (res.status === 404 || res.status === 410) {
          entry.result = 'expired subscription — deleting from DB';
          await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
        } else {
          entry.result = 'unexpected status';
          try { entry.body = (await res.text()).slice(0, 300); } catch {}
        }
      } catch (err) {
        entry.result = 'threw an error';
        entry.error = err && err.message ? err.message : String(err);
        entry.failedAt = err && err.step ? err.step : 'unknown';
        if (err && err.p256dhLen !== undefined) entry.p256dhDecodedBytes = err.p256dhLen; // must be 65
        if (err && err.authLen !== undefined) entry.authDecodedBytes = err.authLen;       // must be 16
      }
      report.results.push(entry);
    }

    return json(report);
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

  return { onRequest: typeof onRequest === 'function' ? onRequest : undefined, onRequestGet: typeof onRequestGet === 'function' ? onRequestGet : undefined, onRequestPost: typeof onRequestPost === 'function' ? onRequestPost : undefined, onRequestPut: typeof onRequestPut === 'function' ? onRequestPut : undefined, onRequestDelete: typeof onRequestDelete === 'function' ? onRequestDelete : undefined, onRequestPatch: typeof onRequestPatch === 'function' ? onRequestPatch : undefined, onRequestOptions: typeof onRequestOptions === 'function' ? onRequestOptions : undefined };
})();

// ================================ SECTION: mcp  (/mcp - the Claude connector, has its own key) ================================
const M_mcp = (() => {
// ===== MCP server: lets Claude (claude.ai, the phone app, voice) read and change your calendar through a "custom connector" =====
// Address:  https://<your site>/mcp      (it does NOT use the site's code cookie; it has its own key instead)
// The key:  the Cloudflare variable MCP_TOKEN (any long random text, 16+ characters).
//           Claude sends it as "Authorization: Bearer <MCP_TOKEN>" (connector setting: Request headers),
//           or you can put it in the address instead:  https://<your site>/mcp?key=<MCP_TOKEN>
// Tools:    time, calendar events + reminders + timers, daily habits and the three notes ("What productive did you do today" ...),
//           money (spent / income), birthdays, ads days, files list, day summaries, and one "day overview" that shows everything for a day.
// Times are Europe/Vilnius (the same zone the notification timer uses). A notification is sent AT the event's start time.
const TZ = 'Europe/Vilnius';
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const J = { 'Content-Type': 'application/json' };
const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const bad = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
const say = (v, isError) => ({ content: [{ type: 'text', text: typeof v === 'string' ? v : JSON.stringify(v, null, 2) }], ...(isError ? { isError: true } : {}) });
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const mins = (t) => { const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(t || '').trim()); return m ? (+m[1]) * 60 + (+m[2]) : null; };
const hhmm = (n) => String(Math.floor(n / 60) % 24).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
function nowInTz() {
  const map = {};
  for (const p of new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'long', hour12: false }).formatToParts(new Date())) map[p.type] = p.value;
  return { date: map.year + '-' + map.month + '-' + map.day, time: (map.hour === '24' ? '00' : map.hour) + ':' + map.minute, weekday: map.weekday, timezone: TZ };
}
const eq = (a, b) => { a = String(a); b = String(b); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return d === 0; };
const shape = (r) => ({ id: r.id, date: r.dateKey, time: hhmm(r.startMinutes), duration_minutes: r.durationMinutes, title: r.type, description: r.description || '', notification_on: !!r.notify });


const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const clampC = (n) => Math.max(0, Math.trunc(Number.isFinite(+n) ? +n : 0));
const clampP = (n) => Math.max(0, Math.min(3, Math.trunc(Number.isFinite(+n) ? +n : 0)));
const dayOrToday = (d) => (d ? (DATE_RE.test(String(d)) && !isNaN(new Date(d + 'T12:00:00')) ? String(d) : null) : nowInTz().date);
const HAB_COLS = ['pushupsCount', 'readPagesCount', 'pullupsCount', 'oneHandPushupsCount', 'breathHoldSeconds'];
const HAB_PIPS = ['stretchPips', 'lSitPips', 'productivePips', 'cardTrickPips'];
const habitShape = (r) => r ? ({ date: r.date, title: r.title || '', pushups: r.pushupsCount || 0, reading_pages: r.readPagesCount || 0, pullups: r.pullupsCount || 0, one_hand_pushups: r.oneHandPushupsCount || 0, breath_hold_seconds: r.breathHoldSeconds || 0, stretch_pips: r.stretchPips || 0, l_sit_pips: r.lSitPips || 0, productive_pips: r.productivePips || 0, card_trick_pips: r.cardTrickPips || 0, woke_at_5: !!r.wokeAt5, productive_note: r.nDay || '', reading_note: r.nRead || '', extra_note: r.nExtra || '' }) : null;
let moneyReady = null, adsReady = null;
const ensureMoney = (db) => moneyReady || (moneyReady = (async () => {
  await db.prepare("CREATE TABLE IF NOT EXISTS money_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, amount REAL NOT NULL, note TEXT DEFAULT '', source TEXT DEFAULT 'manual', created_at TEXT DEFAULT CURRENT_TIMESTAMP)").run();
  const { results } = await db.prepare('PRAGMA table_info(money_entries)').all(); const have = new Set(results.map((r) => r.name));
  for (const c of ['store', 'street', 'item']) if (!have.has(c)) await db.prepare("ALTER TABLE money_entries ADD COLUMN " + c + " TEXT DEFAULT ''").run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_money_date ON money_entries(date)').run();
})().catch((e) => { moneyReady = null; throw e; }));
const ensureAds = (db) => adsReady || (adsReady = db.prepare('CREATE TABLE IF NOT EXISTS ads_days (date TEXT PRIMARY KEY, kind TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 1)').run().catch((e) => { adsReady = null; throw e; }));
const moneyShape = (r) => ({ id: r.id, date: r.date, amount: r.amount, kind: r.amount < 0 ? 'spent' : 'income', store: r.store || '', item: r.item || '', street: r.street || '', note: r.note || '', source: r.source });
const moneyTotals = (rows) => { const spent = rows.filter((e) => e.amount < 0).reduce((s, e) => s - e.amount, 0), got = rows.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0); const r2 = (x) => Math.round(x * 100) / 100; return { spent: r2(spent), income: r2(got), net: r2(got - spent), entries: rows.length }; };
async function getHabitRow(db, date) { return await db.prepare('SELECT * FROM habits WHERE date = ?').bind(date).first(); }
async function saveHabitRow(db, h) {
  await db.prepare('INSERT INTO habits (date, title, pushupsCount, readPagesCount, pullupsCount, oneHandPushupsCount, breathHoldSeconds, stretchPips, lSitPips, productivePips, cardTrickPips, wokeAt5, nDay, nRead, nExtra) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(date) DO UPDATE SET title=excluded.title, pushupsCount=excluded.pushupsCount, readPagesCount=excluded.readPagesCount, pullupsCount=excluded.pullupsCount, oneHandPushupsCount=excluded.oneHandPushupsCount, breathHoldSeconds=excluded.breathHoldSeconds, stretchPips=excluded.stretchPips, lSitPips=excluded.lSitPips, productivePips=excluded.productivePips, cardTrickPips=excluded.cardTrickPips, wokeAt5=excluded.wokeAt5, nDay=excluded.nDay, nRead=excluded.nRead, nExtra=excluded.nExtra')
    .bind(h.date, h.title || '', clampC(h.pushupsCount), clampC(h.readPagesCount), clampC(h.pullupsCount), clampC(h.oneHandPushupsCount), clampC(h.breathHoldSeconds), clampP(h.stretchPips), clampP(h.lSitPips), clampP(h.productivePips), clampP(h.cardTrickPips), h.wokeAt5 ? 1 : 0, h.nDay || '', h.nRead || '', h.nExtra || '').run();
}
const EV_COLS = 'id, dateKey, startMinutes, durationMinutes, type, description, notify';
async function insertEvent(db, { date, start, dur, title, color, description, notify }) {
  const id = 'mcp-' + date + '-' + Math.random().toString(36).slice(2, 8);
  await db.prepare('INSERT INTO habit_events (id, dateKey, startMinutes, durationMinutes, type, color, description, manualLeftPx, manualWidthPx, notify, locked) VALUES (?,?,?,?,?,?,?,NULL,NULL,?,0)').bind(id, date, start, dur, title, color, description || '', notify ? 1 : 0).run();
  return { id, dateKey: date, startMinutes: start, durationMinutes: dur, type: title, description: description || '', notify: notify ? 1 : 0 };
}

const TOOLS = [
  { name: 'get_day_overview', description: 'EVERYTHING saved for one day in one call: calendar events, the habit numbers and notes (including "What productive did you do today"), money spent/earned, the saved AI summary, the ads entry, and attached files. Defaults to today. Use it for "what did I do today?".', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD (default today)' } } } },
  { name: 'get_habits', description: 'Reads the daily habit tracker (push-ups, pages read, pull-ups, breath hold, pips, woke at 5, and the three notes) for a date or a date range.', inputSchema: { type: 'object', properties: { from_date: { type: 'string', description: 'YYYY-MM-DD (default today)' }, to_date: { type: 'string', description: 'YYYY-MM-DD (default from_date)' } } } },
  { name: 'update_habits', description: 'Writes to one day of the habit tracker (default today). Use productive_note for the box "What productive did you do today", reading_note for "What was today\'s reading about?", extra_note for "Anything else". Notes are APPENDED to what is already there unless note_mode is "replace". Counters (pushups, reading_pages, pullups, one_hand_pushups, breath_hold_seconds) are ADDED to the current number unless counter_mode is "set". Pips are 0 to 3. To fill the productive note from a conversation, write a short plain summary of what the owner got done.', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD (default today)' }, productive_note: { type: 'string' }, reading_note: { type: 'string' }, extra_note: { type: 'string' }, note_mode: { type: 'string', enum: ['append', 'replace'] }, title: { type: 'string', description: 'The day title' }, pushups: { type: 'integer' }, reading_pages: { type: 'integer' }, pullups: { type: 'integer' }, one_hand_pushups: { type: 'integer' }, breath_hold_seconds: { type: 'integer' }, counter_mode: { type: 'string', enum: ['add', 'set'] }, stretch_pips: { type: 'integer', description: '0-3' }, l_sit_pips: { type: 'integer', description: '0-3' }, productive_pips: { type: 'integer', description: '0-3' }, card_trick_pips: { type: 'integer', description: '0-3' }, woke_at_5: { type: 'boolean' } } } },
  { name: 'get_money', description: 'Lists money entries (spent and income) between two dates with totals. Spent amounts are negative in the list. Defaults to today.', inputSchema: { type: 'object', properties: { from_date: { type: 'string', description: 'YYYY-MM-DD (default today)' }, to_date: { type: 'string', description: 'YYYY-MM-DD (default from_date)' } } } },
  { name: 'add_expense', description: 'Records money the owner SPENT, e.g. "I spent 300 at Colnas on a new bike, paid cash" -> amount 300, store "Colnas", item "new bike", payment "cash". amount is a positive number; it is saved as a negative entry. Defaults to today and to the current time (Vilnius). Always pass store, item and street when the owner said them; if they did not, still save it right away and then ask once what the store/item/street was.', inputSchema: { type: 'object', properties: { amount: { type: 'number', description: 'Positive number' }, store: { type: 'string', description: 'Where it was spent' }, item: { type: 'string', description: 'What was bought' }, street: { type: 'string' }, payment: { type: 'string', enum: ['cash', 'card', 'apple pay', 'manual'], description: 'How it was paid (shown as "Paid with")' }, time: { type: 'string', description: '24h HH:MM, when it was bought (default: now)' }, note: { type: 'string' }, date: { type: 'string', description: 'YYYY-MM-DD (default today)' } }, required: ['amount'] } },
  { name: 'add_income', description: 'Records money the owner RECEIVED (a positive entry), e.g. cash in hand. Defaults to today and the current time.', inputSchema: { type: 'object', properties: { amount: { type: 'number', description: 'Positive number' }, note: { type: 'string', description: 'Where it came from' }, payment: { type: 'string', enum: ['cash', 'card', 'apple pay', 'manual'] }, time: { type: 'string', description: '24h HH:MM (default: now)' }, date: { type: 'string', description: 'YYYY-MM-DD (default today)' } }, required: ['amount'] } },
  { name: 'delete_money_entry', description: 'Deletes one money entry by its id (get ids from get_money). Ask the owner before deleting.', inputSchema: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] } },
  { name: 'set_timer', description: 'Sets a timer: after the given number of minutes the owner\'s phone gets a notification. It is saved as a calendar event named "Timer: <label>" and is accurate to about a minute.', inputSchema: { type: 'object', properties: { minutes: { type: 'integer', description: '1 to 1440' }, label: { type: 'string', description: 'What the timer is for' } }, required: ['minutes'] } },
  { name: 'list_birthdays', description: 'Lists the saved birthdays.', inputSchema: { type: 'object', properties: {} } },
  { name: 'add_birthday', description: 'Adds a birthday.', inputSchema: { type: 'object', properties: { name: { type: 'string' }, month: { type: 'integer', description: '1-12' }, day: { type: 'integer', description: '1-31' }, year: { type: 'integer', description: 'Birth year (optional)' }, repeat_yearly: { type: 'boolean', description: 'Default true' } }, required: ['name', 'month', 'day'] } },
  { name: 'delete_birthday', description: 'Deletes a birthday by id (get ids from list_birthdays).', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'get_ads', description: 'Reads the Ads calendar (what kind of ad was done on each date: poster or video, and how many).', inputSchema: { type: 'object', properties: { from_date: { type: 'string' }, to_date: { type: 'string' } }, required: ['from_date'] } },
  { name: 'set_ads_day', description: 'Sets what ad was done on a date. kind is poster, video, or none (none clears the day).', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD (default today)' }, kind: { type: 'string', enum: ['poster', 'video', 'none'] }, count: { type: 'integer', description: 'Default 1' } }, required: ['kind'] } },
  { name: 'list_files', description: 'Lists files attached to calendar days (names, types, sizes; not the contents). Optionally for one date.', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD (optional)' } } } },
  { name: 'save_day_summary', description: 'Saves a short summary text for a school day (the same box the Test tab\'s "Run the agent" fills). An empty summary deletes it.', inputSchema: { type: 'object', properties: { date: { type: 'string' }, summary: { type: 'string' } }, required: ['date', 'summary'] } },
  { name: 'add_test', description: 'Adds a school TEST (red) or PROJECT/homework deadline (amber) to the calendar, the same kind the Test tab creates. e.g. "add a math test on Thursday" -> use get_current_time to find the date, then call this with title "Math test". Defaults to 08:00. Set notify true to get a phone notification ONE DAY BEFORE at the same clock time.', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, title: { type: 'string', description: 'e.g. "Math test"' }, kind: { type: 'string', enum: ['test', 'project'], description: 'Default test' }, time: { type: 'string', description: '24h HH:MM, default 08:00' }, description: { type: 'string' }, notify: { type: 'boolean', description: 'Notify one day before (default false)' } }, required: ['date', 'title'] } },
  { name: 'get_current_time', description: 'Returns the current date, time and weekday in the calendar owner\'s time zone (Europe/Vilnius). Call this first to work out words like "today", "tomorrow" or "on Friday".', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_events', description: 'Lists calendar events between two dates (inclusive). Includes tests and projects the Automate tab found (ids start with mdtest- or mdproj-).', inputSchema: { type: 'object', properties: { from_date: { type: 'string', description: 'YYYY-MM-DD' }, to_date: { type: 'string', description: 'YYYY-MM-DD (defaults to from_date)' } }, required: ['from_date'] } },
  { name: 'add_event', description: 'Adds an event to the calendar. If notify is true, a phone notification is sent at the start time.', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: 'Start time, 24h HH:MM' }, title: { type: 'string' }, duration_minutes: { type: 'integer', description: 'Default 45' }, description: { type: 'string' }, notify: { type: 'boolean', description: 'Send a phone notification at the start time (default false)' } }, required: ['date', 'time', 'title'] } },
  { name: 'add_reminder', description: 'Sets a reminder: a short calendar event that sends a phone notification at exactly the given date and time. Use this for "remind me to ... at ...".', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: '24h HH:MM' }, text: { type: 'string', description: 'What to be reminded of' } }, required: ['date', 'time', 'text'] } },
  { name: 'set_notification', description: 'Turns the phone notification of an existing event on or off (it is sent at the event\'s start time).', inputSchema: { type: 'object', properties: { id: { type: 'string' }, on: { type: 'boolean' } }, required: ['id', 'on'] } },
  { name: 'delete_event', description: 'Deletes an event by its id (get ids from list_events). Ask the owner before deleting.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'get_day_summary', description: 'Returns the saved AI summary of one school day (lessons, topics, tests, homework from the e-diary) if the owner made one, plus that day\'s events.', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' } }, required: ['date'] } },
];


const tzOffsetMs = (utcMs) => { const p = {}; for (const x of new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date(utcMs))) p[x.type] = x.value; return Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second) - utcMs; };
function vilniusToUtcSql(date, hm) { const [h, m] = hm.split(':').map(Number); const local = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), h, m); let u = local - tzOffsetMs(local); u = local - tzOffsetMs(u); return new Date(u).toISOString().slice(0, 19).replace('T', ' '); }
function nowInTzFromSql(sql) { const d = new Date(sql.replace(' ', 'T') + 'Z'); const p = {}; for (const x of new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d)) p[x.type] = x.value; return ((+p.hour) % 24) * 60 + (+p.minute); }

// ---- live feed: every change Claude makes is written here; the open site polls /api/live and plays an animation ----
let liveReady = null;
const ensureLive = (db) => liveReady || (liveReady = db.prepare('CREATE TABLE IF NOT EXISTS live_changes (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, kind TEXT, date TEXT, label TEXT, data TEXT)').run().catch((e) => { liveReady = null; throw e; }));
async function logChange(db, kind, date, label, data) {
  await ensureLive(db);
  await db.prepare('INSERT INTO live_changes (ts, kind, date, label, data) VALUES (?,?,?,?,?)').bind(Date.now(), kind, date || '', String(label || '').slice(0, 160), JSON.stringify(data || {})).run();
  await db.prepare('DELETE FROM live_changes WHERE id < (SELECT MAX(id) FROM live_changes) - 200').run();
}
const HAB_LABELS = { pushupsCount: 'Push-ups', readPagesCount: 'Pages read', pullupsCount: 'Pull-ups', oneHandPushupsCount: 'One-hand push-ups', breathHoldSeconds: 'Breath hold (sec)', stretchPips: 'Stretch', lSitPips: 'L-sit', productivePips: 'Productive', cardTrickPips: 'Card trick', wokeAt5: 'Woke at 5', nDay: 'Productive note', nRead: 'Reading note', nExtra: 'Extra note' };
const WRITES = new Set(['add_event', 'add_reminder', 'add_test', 'set_timer', 'delete_event', 'set_notification', 'update_habits', 'add_expense', 'add_income', 'delete_money_entry', 'set_ads_day', 'save_day_summary', 'add_birthday', 'delete_birthday']);
async function callTool(name, a, env) {
  const db = env.DB; a = a || {};
  if (!db || !WRITES.has(name)) return callToolInner(name, a, env);
  const pre = {};
  try {
    if (name === 'update_habits') { const d = dayOrToday(a.date); if (d) pre.habit = await getHabitRow(db, d); }
    if (name === 'delete_event' || name === 'set_notification') pre.ev = await db.prepare('SELECT id, dateKey, startMinutes, type, notify FROM habit_events WHERE id = ?').bind(String(a.id || '')).first();
    if (name === 'delete_money_entry') { await ensureMoney(db); pre.money = await db.prepare('SELECT * FROM money_entries WHERE id = ?').bind(parseInt(a.id, 10) || 0).first(); }
    if (name === 'set_ads_day') { const d = dayOrToday(a.date); if (d) { await ensureAds(db); pre.ads = await db.prepare('SELECT kind, count FROM ads_days WHERE date = ?').bind(d).first(); } }
  } catch (e) {}
  const res = await callToolInner(name, a, env);
  if (res.isError) return res;
  try { await recordLive(name, a, db, res, pre); } catch (e) {}
  return res;
}
async function recordLive(name, a, db, res, pre) {
  let out = {}; try { out = JSON.parse(res.content[0].text) || {}; } catch (e) {}
  if (!out.done && !out.deleted) return;
  if (name === 'add_event' || name === 'add_reminder' || name === 'add_test' || name === 'set_timer') {
    const tag = name === 'add_reminder' ? 'Reminder' : name === 'set_timer' ? 'Timer' : name === 'add_test' ? (out.kind === 'project' ? 'Project' : 'Test') : 'Event';
    const color = { Reminder: '#8b5cf6', Timer: '#f59e0b', Test: '#ef4444', Project: '#f59e0b', Event: '#3b82f6' }[tag];
    return logChange(db, 'event', out.date, out.title, { action: 'add', tag, color, time: out.time, id: out.id, notify: !!out.notification_on });
  }
  if (name === 'delete_event') return logChange(db, 'event', pre.ev ? pre.ev.dateKey : '', pre.ev ? pre.ev.type : '', { action: 'delete', tag: 'Event', time: pre.ev ? hhmm(pre.ev.startMinutes) : '' });
  if (name === 'set_notification') return logChange(db, 'event', pre.ev ? pre.ev.dateKey : '', pre.ev ? pre.ev.type : '', { action: 'notify', tag: 'Event', on: !!a.on });
  if (name === 'update_habits') {
    const d = dayOrToday(a.date), after = await getHabitRow(db, d), b = pre.habit || {}, changes = [];
    for (const [k, label] of Object.entries(HAB_LABELS)) {
      const f = k === 'wokeAt5' ? !!b[k] : (b[k] || (typeof after[k] === 'string' ? '' : 0)), to = k === 'wokeAt5' ? !!after[k] : after[k];
      if (typeof to === 'string') { if ((to || '') !== (f || '')) changes.push({ key: k, label, type: 'note', text: to.slice((f || '').length).trim() || to, from: '', to: '' }); }
      else if (f !== to) changes.push({ key: k, label, type: k === 'wokeAt5' ? 'flag' : /Pips$/.test(k) ? 'pips' : 'count', from: k === 'wokeAt5' ? !!f : +f || 0, to: k === 'wokeAt5' ? !!to : +to || 0 });
    }
    if (a.title !== undefined && (after.title || '') !== (b.title || '')) changes.push({ key: 'title', label: 'Day title', type: 'note', text: after.title || '' });
    if (changes.length) return logChange(db, 'habit', d, 'Habits', { changes });
    return;
  }
  if (name === 'add_expense' || name === 'add_income') return logChange(db, 'money', out.date, out.store || out.item || (name === 'add_income' ? 'Income' : 'Spent'), { action: 'add', amount: out.amount, store: out.store || '', item: out.item || '', street: out.street || '', paid_with: out.paid_with || '', time: out.time || '' });
  if (name === 'delete_money_entry') return logChange(db, 'money', pre.money ? pre.money.date : '', pre.money ? (pre.money.store || pre.money.note) : '', { action: 'delete', amount: pre.money ? pre.money.amount : 0 });
  if (name === 'set_ads_day') { const d = dayOrToday(a.date); return logChange(db, 'ads', d, 'Ads', { from: pre.ads ? pre.ads.kind : 'none', fromCount: pre.ads ? pre.ads.count : 0, to: a.kind, toCount: a.kind === 'none' ? 0 : (out.count || 1) }); }
  if (name === 'save_day_summary') return logChange(db, 'summary', a.date, 'Day summary', { text: String(a.summary || '').slice(0, 140) });
  if (name === 'add_birthday' || name === 'delete_birthday') return logChange(db, 'birthday', '', (out.name || (out.was && out.was.name) || 'Birthday'), { action: name === 'add_birthday' ? 'add' : 'delete', month: out.month || (out.was && out.was.month), day: out.day || (out.was && out.was.day) });
}

async function callToolInner(name, a, env) {
  const db = env.DB; if (!db) return say('The D1 binding DB is missing.', true);
  a = a || {};
  const needDate = (d) => (DATE_RE.test(String(d || '')) && !isNaN(new Date(d + 'T12:00:00')) ? String(d) : null);
  if (name === 'get_current_time') return say(nowInTz());
  if (name === 'list_events') {
    const from = needDate(a.from_date), to = needDate(a.to_date || a.from_date);
    if (!from || !to) return say('from_date and to_date must look like 2026-11-20.', true);
    const { results } = await db.prepare('SELECT id, dateKey, startMinutes, durationMinutes, type, description, notify FROM habit_events WHERE dateKey >= ? AND dateKey <= ? ORDER BY dateKey, startMinutes LIMIT 300').bind(from, to).all();
    return say(results.length ? results.map(shape) : 'No events between ' + from + ' and ' + to + '.');
  }
  if (name === 'add_test') {
    const date = needDate(a.date), title = String(a.title || '').trim().slice(0, 120), start = a.time ? mins(a.time) : 480;
    if (!date) return say('date must look like 2026-11-20.', true);
    if (!title) return say('title is empty.', true);
    if (start == null) return say('time must be 24-hour HH:MM, like 08:00.', true);
    const proj = a.kind === 'project';
    const hashOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
    const id = (proj ? 'mdproj-' : 'mdtest-') + date + '-' + hashOf(title.toLowerCase());
    const color = proj ? '#f59e0b' : '#ef4444', notify = a.notify ? 1 : 0, desc = String(a.description || '').slice(0, 400);
    const have = await db.prepare('SELECT id FROM habit_events WHERE id = ?').bind(id).first();
    if (have) await db.prepare('UPDATE habit_events SET type = ?, description = ?, startMinutes = ?, notify = ? WHERE id = ?').bind(title, desc, start, notify, id).run();
    else await db.prepare('INSERT INTO habit_events (id, dateKey, startMinutes, durationMinutes, type, color, description, manualLeftPx, manualWidthPx, notify, locked) VALUES (?,?,?,?,?,?,?,NULL,NULL,?,0)').bind(id, date, start, 45, title, color, desc, notify).run();
    return say({ done: true, updated_existing: !!have, ...shape({ id, dateKey: date, startMinutes: start, durationMinutes: 45, type: title, description: desc, notify }), kind: proj ? 'project' : 'test', note: notify ? 'A phone notification will arrive one day before at ' + hhmm(start) + '.' : 'No notification (ask if the owner wants one the day before).' });
  }
  if (name === 'add_event' || name === 'add_reminder') {
    const rem = name === 'add_reminder';
    const date = needDate(a.date), start = mins(a.time), title = String(rem ? a.text : a.title || '').trim().slice(0, 120);
    if (!date) return say('date must look like 2026-11-20.', true);
    if (start == null) return say('time must be 24-hour HH:MM, like 08:00 or 17:30.', true);
    if (!title) return say(rem ? 'text is empty.' : 'title is empty.', true);
    const dur = rem ? 15 : Math.min(1440, Math.max(5, parseInt(a.duration_minutes, 10) || 45));
    const id = 'mcp-' + date + '-' + Math.random().toString(36).slice(2, 8);
    const notify = rem ? 1 : (a.notify ? 1 : 0);
    await db.prepare('INSERT INTO habit_events (id, dateKey, startMinutes, durationMinutes, type, color, description, manualLeftPx, manualWidthPx, notify, locked) VALUES (?,?,?,?,?,?,?,NULL,NULL,?,0)')
      .bind(id, date, start, dur, title, rem ? '#8b5cf6' : '#3b82f6', rem ? '' : String(a.description || '').slice(0, 400), notify).run();
    return say({ done: true, ...shape({ id, dateKey: date, startMinutes: start, durationMinutes: dur, type: title, description: rem ? '' : String(a.description || ''), notify }), note: notify ? 'A phone notification will be sent at ' + hhmm(start) + ' on ' + date + ' (Vilnius time).' : 'No notification was set.' });
  }
  if (name === 'set_notification') {
    const row = await db.prepare('SELECT id, dateKey, startMinutes, durationMinutes, type, description, notify FROM habit_events WHERE id = ?').bind(String(a.id || '')).first();
    if (!row) return say('No event with that id.', true);
    await db.prepare('UPDATE habit_events SET notify = ? WHERE id = ?').bind(a.on ? 1 : 0, row.id).run();
    const auto = /^md(test|proj)-/.test(row.id);
    return say({ done: true, ...shape({ ...row, notify: a.on ? 1 : 0 }), note: a.on ? (auto ? 'This is a test/project from the Automate tab: its notification is sent ONE DAY BEFORE, at ' + hhmm(row.startMinutes) + '.' : 'A phone notification will be sent at ' + hhmm(row.startMinutes) + ' on ' + row.dateKey + '.') : 'Notification switched off.' });
  }
  if (name === 'delete_event') {
    const row = await db.prepare('SELECT id, dateKey, startMinutes, durationMinutes, type, description, notify FROM habit_events WHERE id = ?').bind(String(a.id || '')).first();
    if (!row) return say('No event with that id.', true);
    await db.prepare('DELETE FROM habit_events WHERE id = ?').bind(row.id).run();
    return say({ deleted: true, was: shape(row) });
  }
  if (name === 'get_day_summary') {
    const d = needDate(a.date); if (!d) return say('date must look like 2026-11-20.', true);
    let sum = null; try { sum = await db.prepare('SELECT summary, updated FROM au_day_summary WHERE day = ?').bind(d).first(); } catch (e) { /* table not made yet */ }
    const { results } = await db.prepare('SELECT id, dateKey, startMinutes, durationMinutes, type, description, notify FROM habit_events WHERE dateKey = ? ORDER BY startMinutes').bind(d).all();
    return say({ date: d, summary: sum ? sum.summary : null, summary_made: sum ? sum.updated : null, events: results.map(shape), hint: sum ? undefined : 'No summary was saved for this day. The owner can make one with "Run the agent" in the Test tab.' });
  }

  if (name === 'get_day_overview') {
    const d = dayOrToday(a.date); if (!d) return say('date must look like 2026-11-20.', true);
    const out = { date: d };
    const q = async (fn) => { try { return await fn(); } catch (e) { return null; } };
    out.events = (await db.prepare('SELECT ' + EV_COLS + ' FROM habit_events WHERE dateKey = ? ORDER BY startMinutes').bind(d).all()).results.map(shape);
    out.habits = habitShape(await q(() => getHabitRow(db, d)));
    out.money = await q(async () => { await ensureMoney(db); const rows = (await db.prepare('SELECT * FROM money_entries WHERE date = ? ORDER BY id').bind(d).all()).results; return { totals: moneyTotals(rows), entries: rows.map(moneyShape) }; });
    out.saved_day_summary = await q(async () => { const s = await db.prepare('SELECT summary, updated FROM au_day_summary WHERE day = ?').bind(d).first(); return s ? s.summary : null; });
    out.ads = await q(async () => { await ensureAds(db); return await db.prepare('SELECT kind, count FROM ads_days WHERE date = ?').bind(d).first(); });
    out.files = await q(async () => (await db.prepare('SELECT id, name, type, size FROM files WHERE date = ?').bind(d).all()).results);
    return say(out);
  }
  if (name === 'get_habits') {
    const from = dayOrToday(a.from_date), to = dayOrToday(a.to_date || a.from_date || undefined);
    if (!from || !to) return say('Dates must look like 2026-11-20.', true);
    const { results } = await db.prepare('SELECT * FROM habits WHERE date >= ? AND date <= ? ORDER BY date LIMIT 400').bind(from, to).all();
    return say(results.length ? results.map(habitShape) : 'No habit entries between ' + from + ' and ' + to + '.');
  }
  if (name === 'update_habits') {
    const d = dayOrToday(a.date); if (!d) return say('date must look like 2026-11-20.', true);
    const row = (await getHabitRow(db, d)) || { date: d };
    const h = { ...row, date: d };
    const append = a.note_mode !== 'replace', add = a.counter_mode !== 'set';
    const noteMap = [['productive_note', 'nDay'], ['reading_note', 'nRead'], ['extra_note', 'nExtra']];
    for (const [k, col] of noteMap) if (typeof a[k] === 'string') { const v = a[k].trim().slice(0, 4000); h[col] = append && h[col] ? (v ? h[col] + '\n' + v : h[col]) : v; }
    if (typeof a.title === 'string') h.title = a.title.slice(0, 200);
    const cm = { pushups: 'pushupsCount', reading_pages: 'readPagesCount', pullups: 'pullupsCount', one_hand_pushups: 'oneHandPushupsCount', breath_hold_seconds: 'breathHoldSeconds' };
    for (const [k, col] of Object.entries(cm)) if (num(a[k]) !== null) h[col] = clampC(add ? (num(h[col]) || 0) + num(a[k]) : num(a[k]));
    const pm = { stretch_pips: 'stretchPips', l_sit_pips: 'lSitPips', productive_pips: 'productivePips', card_trick_pips: 'cardTrickPips' };
    for (const [k, col] of Object.entries(pm)) if (num(a[k]) !== null) h[col] = clampP(num(a[k]));
    if (typeof a.woke_at_5 === 'boolean') h.wokeAt5 = a.woke_at_5;
    await saveHabitRow(db, h);
    return say({ done: true, habits: habitShape(await getHabitRow(db, d)), note: 'Saved. An open calendar site updates by itself with an animation.' });
  }
  if (name === 'get_money') {
    const from = dayOrToday(a.from_date), to = dayOrToday(a.to_date || a.from_date || undefined);
    if (!from || !to) return say('Dates must look like 2026-11-20.', true);
    await ensureMoney(db);
    const rows = (await db.prepare('SELECT * FROM money_entries WHERE date >= ? AND date <= ? ORDER BY date, id LIMIT 500').bind(from, to).all()).results;
    return say({ from, to, totals: moneyTotals(rows), entries: rows.map(moneyShape) });
  }
  if (name === 'add_expense' || name === 'add_income') {
    const inc = name === 'add_income', amt = Math.abs(num(a.amount) ?? NaN), d = dayOrToday(a.date);
    if (!(amt > 0)) return say('amount must be a number above zero.', true);
    if (!d) return say('date must look like 2026-11-20.', true);
    await ensureMoney(db);
    const store = inc ? '' : String(a.store || '').trim().slice(0, 120), item = inc ? '' : String(a.item || '').trim().slice(0, 200), street = inc ? '' : String(a.street || '').trim().slice(0, 150);
    const note = String(a.note || (inc ? 'Income' : store || item || 'Spent')).slice(0, 200);
    const pay = String(a.payment || 'manual').toLowerCase(); const source = ['cash', 'card', 'apple pay', 'manual'].includes(pay) ? pay : 'manual';
    const tm = a.time ? mins(a.time) : null; if (a.time && tm == null) return say('time must be 24-hour HH:MM, like 14:30.', true);
    const created = tm != null ? vilniusToUtcSql(d, hhmm(tm)) : (d === nowInTz().date ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null);
    const res = await db.prepare('INSERT INTO money_entries (date, amount, note, source, store, street, item, created_at) VALUES (?,?,?,?,?,?,?,?)').bind(d, inc ? amt : -amt, note, source, store, street, item, created).run();
    return say({ done: true, id: res && res.meta ? res.meta.last_row_id : undefined, date: d, time: created ? hhmm(nowInTzFromSql(created)) : '', amount: inc ? amt : -amt, kind: inc ? 'income' : 'spent', store, item, street, paid_with: source, note: 'Saved. An open calendar site updates by itself with an animation.' });
  }
  if (name === 'delete_money_entry') {
    await ensureMoney(db);
    const row = await db.prepare('SELECT * FROM money_entries WHERE id = ?').bind(parseInt(a.id, 10) || 0).first();
    if (!row) return say('No money entry with that id.', true);
    await db.prepare('DELETE FROM money_entries WHERE id = ?').bind(row.id).run();
    return say({ deleted: true, was: moneyShape(row) });
  }
  if (name === 'set_timer') {
    const m = parseInt(a.minutes, 10);
    if (!(m >= 1 && m <= 1440)) return say('minutes must be between 1 and 1440.', true);
    const target = new Date(Math.ceil((Date.now() + m * 60000) / 60000) * 60000);
    const map = {}; for (const p of new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(target)) map[p.type] = p.value;
    const date = map.year + '-' + map.month + '-' + map.day, start = (+(map.hour === '24' ? '0' : map.hour)) * 60 + (+map.minute);
    const label = String(a.label || '').trim().slice(0, 100);
    const ev = await insertEvent(db, { date, start, dur: 5, title: 'Timer: ' + (label || m + ' min'), color: '#f59e0b', description: '', notify: true });
    return say({ done: true, rings_at: date + ' ' + hhmm(start) + ' (Vilnius time)', ...shape(ev), note: 'The phone notification arrives at about ' + hhmm(start) + ', accurate to roughly a minute. It also shows on the calendar.' });
  }
  if (name === 'list_birthdays') {
    const { results } = await db.prepare('SELECT id, name, month, day, year, repeatYearly FROM habit_birthdays ORDER BY month ASC, day ASC').all();
    return say(results.length ? results.map((b) => ({ id: b.id, name: b.name, month: b.month, day: b.day, year: b.year, repeats_yearly: !!b.repeatYearly })) : 'No birthdays saved.');
  }
  if (name === 'add_birthday') {
    const nm = String(a.name || '').trim().slice(0, 120), mo = parseInt(a.month, 10), dy = parseInt(a.day, 10);
    if (!nm || !(mo >= 1 && mo <= 12) || !(dy >= 1 && dy <= 31)) return say('Need a name, a month (1-12) and a day (1-31).', true);
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO habit_birthdays (id, name, month, day, year, repeatYearly) VALUES (?,?,?,?,?,?)').bind(id, nm, mo, dy, parseInt(a.year, 10) || null, a.repeat_yearly === false ? 0 : 1).run();
    return say({ done: true, id, name: nm, month: mo, day: dy });
  }
  if (name === 'delete_birthday') {
    const row = await db.prepare('SELECT id, name, month, day FROM habit_birthdays WHERE id = ?').bind(String(a.id || '')).first();
    if (!row) return say('No birthday with that id.', true);
    await db.prepare('DELETE FROM habit_birthdays WHERE id = ?').bind(row.id).run();
    return say({ deleted: true, was: row });
  }
  if (name === 'get_ads') {
    const from = needDate(a.from_date), to = needDate(a.to_date || a.from_date); if (!from || !to) return say('Dates must look like 2026-11-20.', true);
    await ensureAds(db);
    const { results } = await db.prepare('SELECT date, kind, count FROM ads_days WHERE date >= ? AND date <= ? ORDER BY date').bind(from, to).all();
    return say(results.length ? results : 'No ads recorded between ' + from + ' and ' + to + '.');
  }
  if (name === 'set_ads_day') {
    const d = dayOrToday(a.date); if (!d) return say('date must look like 2026-11-20.', true);
    if (!['poster', 'video', 'none'].includes(a.kind)) return say('kind must be poster, video or none.', true);
    await ensureAds(db);
    if (a.kind === 'none') { await db.prepare('DELETE FROM ads_days WHERE date = ?').bind(d).run(); return say({ done: true, date: d, kind: 'none (cleared)' }); }
    const c = Math.max(1, Math.min(99, parseInt(a.count, 10) || 1));
    await db.prepare('INSERT INTO ads_days (date, kind, count) VALUES (?,?,?) ON CONFLICT(date) DO UPDATE SET kind = excluded.kind, count = excluded.count').bind(d, a.kind, c).run();
    return say({ done: true, date: d, kind: a.kind, count: c });
  }
  if (name === 'list_files') {
    const d = a.date ? needDate(a.date) : null; if (a.date && !d) return say('date must look like 2026-11-20.', true);
    const q = d ? db.prepare('SELECT id, date, name, type, size, uploaded FROM files WHERE date = ? ORDER BY id').bind(d) : db.prepare('SELECT id, date, name, type, size, uploaded FROM files ORDER BY date DESC, id DESC LIMIT 100');
    const { results } = await q.all();
    return say(results.length ? results : 'No files.');
  }
  if (name === 'save_day_summary') {
    const d = needDate(a.date); if (!d) return say('date must look like 2026-11-20.', true);
    await db.prepare('CREATE TABLE IF NOT EXISTS au_day_summary (day TEXT PRIMARY KEY, summary TEXT, updated TEXT)').run();
    const s = String(a.summary || '').trim().slice(0, 4000);
    if (!s) { await db.prepare('DELETE FROM au_day_summary WHERE day = ?').bind(d).run(); return say({ done: true, deleted: true }); }
    await db.prepare('INSERT INTO au_day_summary (day, summary, updated) VALUES (?,?,?) ON CONFLICT(day) DO UPDATE SET summary = excluded.summary, updated = excluded.updated').bind(d, s, new Date().toISOString()).run();
    return say({ done: true, date: d });
  }
  return say('Unknown tool ' + name, true);
}

async function handle(msg, env) {
  const id = msg && msg.id !== undefined ? msg.id : undefined;
  if (!msg || typeof msg.method !== 'string') return id === undefined ? null : bad(id, -32600, 'Invalid request');
  if (id === undefined) return null;                                                   // a notification: no answer
  if (msg.method === 'initialize') {
    const want = msg.params && msg.params.protocolVersion;
    return ok(id, { protocolVersion: PROTOCOLS.includes(want) ? want : PROTOCOLS[1], capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'habit-calendar', version: '1.0.0' }, instructions: 'Tools for the owner\'s whole calendar site: events, reminders, timers, daily habits and notes, money, birthdays, ads, files. Times are Europe/Vilnius. Call get_current_time first to resolve "today"/"tomorrow". For "what did I do today" use get_day_overview. To fill the "What productive did you do today" box use update_habits with productive_note. Money spent uses add_expense (positive amount). Reminders use add_reminder, timers use set_timer. Do not delete anything without asking the owner first.' });
  }
  if (msg.method === 'ping') return ok(id, {});
  if (msg.method === 'tools/list') return ok(id, { tools: TOOLS });
  if (msg.method === 'tools/call') {
    const p = msg.params || {};
    if (!TOOLS.some((t) => t.name === p.name)) return bad(id, -32602, 'Unknown tool: ' + p.name);
    try { return ok(id, await callTool(p.name, p.arguments, env)); } catch (e) { return ok(id, say('The calendar database failed: ' + e.message, true)); }
  }
  return bad(id, -32601, 'Method not found: ' + msg.method);
}

async function onRequest({ request, env }) {
  if (!env.MCP_TOKEN || String(env.MCP_TOKEN).length < 16) return new Response('MCP is not set up: add the variable MCP_TOKEN (16 or more characters) in Cloudflare Pages -> Settings -> Variables and Secrets.', { status: 503 });
  const url = new URL(request.url);
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim() || url.searchParams.get('key') || '';
  if (!eq(given, env.MCP_TOKEN)) return new Response('Unauthorized', { status: 401 });
  if (request.method === 'POST') {
    let body; try { body = await request.json(); } catch (e) { return new Response(JSON.stringify(bad(null, -32700, 'Parse error')), { status: 400, headers: J }); }
    if (Array.isArray(body)) { const out = (await Promise.all(body.map((m) => handle(m, env)))).filter(Boolean); return out.length ? new Response(JSON.stringify(out), { headers: J }) : new Response(null, { status: 202 }); }
    const out = await handle(body, env);
    return out ? new Response(JSON.stringify(out), { headers: J }) : new Response(null, { status: 202 });
  }
  return new Response('Use POST', { status: 405, headers: { Allow: 'POST' } });
}

  return { onRequest };
})();

// ================================ ROUTER ================================
const ROUTES = {
  'ads': M_ads,
  'auth': M_auth,
  'automate': M_automate,
  'events': M_events,
  'files': M_files,
  'habits': M_habits,
  'live': M_live,
  'money-scan': M_money_scan,
  'money': M_money,
  'push-check': M_push_check,
  'push-subscribe': M_push_subscribe,
  'spend': M_spend,
  'talk-ai': M_talk_ai,
  'test-push': M_test_push
};
const reply = (status, text) => new Response(JSON.stringify({ error: text }), { status, headers: { 'Content-Type': 'application/json' } });
async function routeApi(ctx) {
  const seg = new URL(ctx.request.url).pathname.replace(/^\/api\/?/, '').split('/')[0];
  const mod = Object.prototype.hasOwnProperty.call(ROUTES, seg) ? ROUTES[seg] : null;
  if (!mod) return reply(404, 'Not found');
  const method = ctx.request.method.toUpperCase();
  const key = 'onRequest' + method.charAt(0) + method.slice(1).toLowerCase();
  const handler = mod[key] || (method === 'HEAD' ? mod.onRequestGet : null) || mod.onRequest;
  if (!handler) return reply(405, 'Method not allowed');
  return handler(ctx);
}

// ================================ SECTION: the code gate (runs first for everything) ================================
// functions/_middleware.js  —  access-code gate for the WHOLE site (pages + /api/*)
//
// Needs in Cloudflare Pages -> Settings -> Variables and Secrets:
//   code   (secret)  — the access code you type once on each device/browser
//
// How it works
//   * No valid cookie  -> every request gets a small "enter code" page (or a 401 for API calls).
//   * Right code       -> a cookie is saved for 1 year; the site opens straight away from then on.
//   * The cookie holds an HMAC of the code (not the code itself), so it cannot be used to read the code.
//   * If the "code" variable is missing the site stays LOCKED (fails closed) instead of opening to everyone.
//
// Left open on purpose (they are called by things that cannot hold a cookie):
//   /api/push-check        called by the outside cron job that sends notifications (it was already open before)
//   /api/spend             Apple Pay shortcut — only when it sends "Authorization: Bearer ...",
//                          and spend.js checks that token itself
//   /manifest.json, /favicon.png   Chrome fetches these without cookies (needed for "Add to home screen")

const COOKIE = 'site_access';
const LOGIN_PATH = '/__code';
const enc = new TextEncoder();

async function sign(code) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(code)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('habit-calendar-access-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function same(a, b) {            // constant-time string compare
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function page(message, status) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Enter code</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f5f7;font:16px system-ui,-apple-system,sans-serif;color:#111}
  form{background:#fff;padding:28px;border-radius:20px;box-shadow:0 8px 30px rgba(0,0,0,.08);width:min(320px,86vw);display:grid;gap:12px}
  h1{font-size:18px;margin:0}
  input{height:44px;border:1px solid #e2e2e6;border-radius:12px;padding:0 14px;font:inherit;background:#f7f7f9}
  input:focus{outline:none;border-color:#0a84ff;box-shadow:0 0 0 4px rgba(10,132,255,.15);background:#fff}
  button{height:44px;border:0;border-radius:12px;background:#111;color:#fff;font:inherit;font-weight:600;cursor:pointer}
  p{margin:0;color:#dc2626;font-size:14px}
  @media (prefers-color-scheme:dark){body{background:#000;color:#f5f5f5}form{background:#1c1c1e}input{background:#2c2c2e;border-color:#3a3a3c;color:#f5f5f5}button{background:#f5f5f5;color:#111}}
</style></head><body>
<form method="POST" action="${LOGIN_PATH}">
  <h1>Enter code</h1>
  <input type="password" name="code" autocomplete="current-password" autofocus required aria-label="Code">
  ${message ? `<p>${message}</p>` : ''}
  <button type="submit">Open</button>
</form></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;
  // once someone is allowed in: /api/... goes to the API sections above, everything else is the normal site
  const next = () => (path.startsWith('/api/') ? routeApi(ctx) : ctx.next());
  if (path === '/mcp' || path === '/mcp/') return M_mcp.onRequest(ctx);   // the Claude connector: it checks its own key (MCP_TOKEN), not the site cookie

  // things that must stay reachable without a cookie
  if (path === '/api/push-check') return next();
  if (path === '/api/spend' && /^Bearer\s/i.test(request.headers.get('Authorization') || '')) return next();
  if (path === '/manifest.json' || path === '/favicon.png') return next();

  if (!env.code) {
    return new Response('Site locked: the "code" variable is not set in Cloudflare Pages (Settings -> Variables and Secrets).',
      { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const expected = await sign(env.code);

  // submitting the code
  if (path === LOGIN_PATH && request.method === 'POST') {
    let given = '';
    try { given = String((await request.formData()).get('code') || ''); } catch (e) {}
    if (given && same(await sign(given), expected)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Cache-Control': 'no-store',
          'Set-Cookie': `${COOKIE}=${expected}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`,
        },
      });
    }
    await new Promise((r) => setTimeout(r, 800));          // slows down guessing
    return page('Wrong code.', 401);
  }

  // already allowed in?
  const have = readCookie(request, COOKIE);
  if (have && same(have, expected)) return next();

  // not allowed: pretty page for browsers, plain 401 for everything else
  const wantsPage = request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
  if (wantsPage) return page('', 401);
  return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}
