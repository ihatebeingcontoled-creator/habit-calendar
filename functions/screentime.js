// functions/screentime.js  ->  https://<your site>/screentime   (an API only: the Screen Time screen itself lives inside index.html)
// ONE server file for the whole Screen Time feature:
//   * the page's data     POST /screentime?api=data | set | script   (behind the code gate, uses your cookie)
//   * the PC program      POST /screentime?api=push   (the PC sends its seconds)
//                         GET  /screentime?api=conf   (the PC reads your settings)
//                         both need "Authorization: Bearer <SCREENTIME_TOKEN>" and are let through the gate by one line in _middleware.js
//   * the iPhone          POST /screentime?api=phone&app=<name>&e=open|close   (an iOS Shortcuts automation calls this when an app is opened / closed;
//                         same Bearer token, same gate line. The time between open and close is stored under the device "iphone", app name "<name> (iphone)")
//   * the PC program itself (an AutoHotkey v1.1 script) is the SCRIPT text at the bottom; the "Download PC script" button in the
//     Screen Time screen hands it out with your site address and token already filled in.
//
// Needs in Cloudflare Pages -> Settings -> Variables and Secrets:
//   SCREENTIME_TOKEN  (secret) — any long random text; it is baked into the downloaded PC script
// Uses the same D1 binding as the rest of the site: DB   (tables are created automatically, no sql to run)
//
// What is stored (all of it here in D1; the PC program keeps nothing on disk)
//   runtime   how long the PC was on each day (the number the PC shows in the corner of its screen)
//   adjust    time you subtract (or add) by hand on a day, e.g. the PC was on but you were AFK
//   usage     seconds per program per day (chrome.exe ...), only while you were really using it
//   settings  idle minutes, which apps count, overlay on/off, overlay only on an empty desktop, overlay corner, overlay strength, break reminder on/off + minutes
//   break     when the PC reports N minutes of non-stop use, a phone notification is sent through the site's existing push system
//             (this file only raises the alert; the gate in _middleware.js sends it, see the X-Screentime-Alert header)
// POSTs are used for everything the page asks for on purpose: sw.js caches GETs, and these must never be cached.

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const text = (t, s = 200) => new Response(t, { status: s, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CORNERS = ['bl', 'br', 'tl', 'tr'];

let ready = null;
function ensure(db) {
  if (ready) return ready;
  ready = db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_usage (day TEXT NOT NULL, device TEXT NOT NULL, app TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, device, app))'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_apps (app TEXT PRIMARY KEY, counts INTEGER NOT NULL DEFAULT 1, alive INTEGER NOT NULL DEFAULT 0)'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_conf (k TEXT PRIMARY KEY, v TEXT)'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_devices (device TEXT PRIMARY KEY, last_seen INTEGER)'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_runtime (day TEXT NOT NULL, device TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, device))'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_hourly (day TEXT NOT NULL, device TEXT NOT NULL, hour INTEGER NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, device, hour))'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_adjust (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, seconds INTEGER NOT NULL, created INTEGER)'),
  ]).catch((e) => { ready = null; throw e; });
  return ready;
}

function shiftDay(day, n) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const cleanApp = (a) => String(a || '').replace(/[\t\r\n|]/g, '').trim().toLowerCase().slice(0, 80);
const cleanDevice = (d) => String(d || 'pc').replace(/[^\w.\- ]/g, '').slice(0, 40) || 'pc';
const tokenOk = (request, env) => Boolean(env.SCREENTIME_TOKEN) && (request.headers.get('Authorization') || '') === 'Bearer ' + env.SCREENTIME_TOKEN;

async function getConf(db) {
  const { results } = await db.prepare('SELECT k, v FROM screentime_conf').all();
  const m = {};
  for (const r of results) m[r.k] = r.v;
  const idle = parseInt(m.idle, 10), op = parseInt(m.opacity, 10), bm = parseInt(m.breakmin, 10);
  return {
    idle: idle >= 30 ? idle : 300,                                   // seconds
    overlay: m.overlay === '0' ? 0 : 1,
    corner: CORNERS.includes(m.corner) ? m.corner : 'bl',
    opacity: op >= 10 && op <= 100 ? op : 55,                        // percent
    desk: m.desk === '0' ? 0 : 1,                                    // 1 = show the counter only when no program window is open
    idleCounts: m.idlecounts === '0' ? 0 : 1,                        // 1 = PC idle time counts toward the PC on-time
    colors: m.colors === '0' ? 0 : 1,                                // colour the days by how they compare with the average
    breakOn: m.breakon === '0' ? 0 : 1,
    breakMin: bm >= 15 && bm <= 480 ? bm : 120,                      // minutes of non-stop use before the reminder
    lastBreak: parseInt(m.lastbreak, 10) || 0,
    tz: m.tz || 'UTC',                                               // the page sends your time zone; the iPhone events are cut into days/hours with it
    phoneOpen: m.phoneopen && m.phoneopen.includes('|') ? { app: m.phoneopen.slice(0, m.phoneopen.lastIndexOf('|')), t: parseInt(m.phoneopen.slice(m.phoneopen.lastIndexOf('|') + 1), 10) || 0 } : null,
  };
}
const setConf = (db, k, v) => db.prepare('INSERT INTO screentime_conf (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, String(v)).run();

const tzOk = (z) => { try { new Intl.DateTimeFormat('en-CA', { timeZone: z }); return true; } catch (e) { return false; } };
// local day, hour and seconds left in that hour, for a moment in time
function dayHour(ms, tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tzOk(tz) ? tz : 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const o = {};
  for (const p of f.formatToParts(ms)) o[p.type] = p.value;
  return { day: o.year + '-' + o.month + '-' + o.day, hour: parseInt(o.hour, 10) % 24, left: 3600 - (parseInt(o.minute, 10) * 60 + parseInt(o.second, 10)) };
}
const PHONE_MAX = 2 * 3600;   // an open that never got its close (iOS skipped it) is counted for at most this long

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const api = url.searchParams.get('api');

  // the screen lives inside the calendar now: anyone who opens this address directly is sent there
  if (!api) return Response.redirect(url.origin + '/', 302);

  const db = env.DB;
  if (!db) return json({ error: 'no database (binding DB)' }, 500);

  try {
    await ensure(db);

    // ───────── from the PC (token) ─────────
    if (api === 'push') {
      if (request.method !== 'POST') return text('Method not allowed', 405);
      if (!tokenOk(request, env)) return text('Unauthorized', 401);
      const device = cleanDevice(url.searchParams.get('device'));
      const lines = (await request.text()).split('\n').slice(0, 600);
      const st = [];
      let breakMins = 0;
      for (const line of lines) {
        const f = line.replace(/\r$/, '').split('\t');
        if (f[0] === 'B') {                                           // B <tab> minutes   = "I have been used non-stop for this long"
          const mins = parseInt(f[1], 10);
          if (mins >= 1 && mins <= 1440) breakMins = mins;
          continue;
        }
        if (f[0] === 'H') {                                           // H <tab> day <tab> hour <tab> seconds   = PC-on time inside one hour of the day
          const hr = parseInt(f[2], 10), secs = parseInt(f[3], 10);
          if (DAY.test(f[1] || '') && hr >= 0 && hr <= 23 && secs >= 1)
            st.push(db.prepare('INSERT INTO screentime_hourly (day, device, hour, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(day, device, hour) DO UPDATE SET seconds = seconds + excluded.seconds').bind(f[1], device, hr, Math.min(secs, 3600)));
          continue;
        }
        if (f[0] === 'R') {                                           // R <tab> day <tab> seconds   = PC-on time
          const secs = parseInt(f[2], 10);
          if (DAY.test(f[1] || '') && secs >= 1)
            st.push(db.prepare('INSERT INTO screentime_runtime (day, device, seconds) VALUES (?, ?, ?) ON CONFLICT(day, device) DO UPDATE SET seconds = seconds + excluded.seconds').bind(f[1], device, Math.min(secs, 86400)));
          continue;
        }
        const app = cleanApp(f[1]);                                   // day <tab> app <tab> seconds   = time in a program
        const secs = parseInt(f[2], 10);
        if (!DAY.test(f[0] || '') || !app || !(secs >= 1)) continue;
        if (!app.startsWith('(')) st.push(db.prepare('INSERT OR IGNORE INTO screentime_apps (app) VALUES (?)').bind(app));   // names in brackets, like (idle), are not programs: no Counts switch
        st.push(db.prepare('INSERT INTO screentime_usage (day, device, app, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(day, device, app) DO UPDATE SET seconds = seconds + excluded.seconds')
          .bind(f[0], device, app, Math.min(secs, 86400)));
      }
      st.push(db.prepare('INSERT INTO screentime_devices (device, last_seen) VALUES (?, ?) ON CONFLICT(device) DO UPDATE SET last_seen = excluded.last_seen').bind(device, Date.now()));
      await db.batch(st);
      const res = text('ok');
      if (breakMins) {
        const c = await getConf(db);
        if (c.breakOn && Date.now() - c.lastBreak > 10 * 60 * 1000) {     // never twice within 10 minutes, even if the PC resends
          await setConf(db, 'lastbreak', Date.now());
          const h = Math.floor(breakMins / 60), m = breakMins % 60;
          const t = h ? h + 'h ' + (m < 10 ? '0' : '') + m + 'm' : m + ' min';
          res.headers.set('X-Screentime-Alert', encodeURIComponent(JSON.stringify({
            title: 'Time for a break',
            body: 'You have been on the PC for ' + t + ' straight. Stand up, stretch, drink some water.',
          })));
        }
      }
      return res;
    }

    // ───────── from the iPhone (token): an app was opened / closed ─────────
    if (api === 'phone') {
      if (!tokenOk(request, env)) return text('Unauthorized', 401);
      const base = cleanApp(url.searchParams.get('app')).replace(/[()]/g, '').trim();
      const ev = url.searchParams.get('e');
      if (!base || (ev !== 'open' && ev !== 'close')) return text('need app=<name> and e=open or e=close', 400);
      const name = base + ' (iphone)', now = Date.now(), c = await getConf(db), cur = c.phoneOpen;
      const st = [db.prepare('INSERT INTO screentime_devices (device, last_seen) VALUES (?, ?) ON CONFLICT(device) DO UPDATE SET last_seen = excluded.last_seen').bind('iphone', now)];
      // only one app is in front at a time: opening any app ends whatever was still "open" (e.g. a close iOS never sent), closing ends the matching one
      if (cur && cur.t && (ev === 'open' || cur.app === name)) {
        let secs = Math.min(Math.round((now - cur.t) / 1000), PHONE_MAX);
        const row = await db.prepare('SELECT counts FROM screentime_apps WHERE app = ?').bind(cur.app).first();
        if (row && !row.counts) secs = 0;                              // you switched "Counts" off for it on the site
        if (secs >= 2) {
          st.push(db.prepare('INSERT OR IGNORE INTO screentime_apps (app) VALUES (?)').bind(cur.app));
          let t = cur.t, left = secs;
          while (left >= 1) {                                          // cut at the hour limits of your local time
            const p = dayHour(t, c.tz), n = Math.min(left, p.left);
            st.push(db.prepare('INSERT INTO screentime_usage (day, device, app, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(day, device, app) DO UPDATE SET seconds = seconds + excluded.seconds').bind(p.day, 'iphone', cur.app, n));
            st.push(db.prepare('INSERT INTO screentime_hourly (day, device, hour, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(day, device, hour) DO UPDATE SET seconds = seconds + excluded.seconds').bind(p.day, 'iphone', p.hour, n));
            st.push(db.prepare('INSERT INTO screentime_runtime (day, device, seconds) VALUES (?, ?, ?) ON CONFLICT(day, device) DO UPDATE SET seconds = seconds + excluded.seconds').bind(p.day, 'iphone', n));
            t += n * 1000; left -= n;
          }
        }
      }
      await db.batch(st);
      await setConf(db, 'phoneopen', ev === 'open' ? name + '|' + now : '');
      return text('ok');
    }

    if (api === 'conf') {
      if (request.method !== 'GET') return text('Method not allowed', 405);
      if (!tokenOk(request, env)) return text('Unauthorized', 401);
      const c = await getConf(db);
      let out = 'idle=' + c.idle + '\noverlay=' + c.overlay + '\ncorner=' + c.corner + '\nopacity=' + c.opacity + '\ndesk=' + c.desk + '\nbreakon=' + c.breakOn + '\nbreakmin=' + c.breakMin + '\n';
      const day = url.searchParams.get('day') || '';
      if (DAY.test(day)) {
        const device = cleanDevice(url.searchParams.get('device'));
        const rt = await db.prepare('SELECT seconds FROM screentime_runtime WHERE day = ? AND device = ?').bind(day, device).first();
        const adj = await db.prepare('SELECT COALESCE(SUM(seconds), 0) AS s FROM screentime_adjust WHERE day = ?').bind(day).first();
        const dv = await db.prepare('SELECT last_seen FROM screentime_devices WHERE device = ?').bind(device).first();
        out += 'runtime=' + (rt ? rt.seconds : 0) + '\nadjust=' + (adj ? adj.s : 0) + '\nlastseenago=' + (dv ? Math.max(0, Math.round((Date.now() - dv.last_seen) / 1000)) : -1) + '\n';
      }
      const { results } = await db.prepare('SELECT app, counts, alive FROM screentime_apps WHERE counts = 0 OR alive = 1').all();
      for (const r of results) {
        if (!r.counts) out += 'ignore=' + r.app + '\n';
        else if (r.alive) out += 'alive=' + r.app + '\n';
      }
      return text(out);
    }

    // ───────── from the page (cookie, already checked by the gate) ─────────
    if (request.method !== 'POST') return text('Method not allowed', 405);

    if (api === 'data') {
      const b = await request.json().catch(() => ({}));
      const today = String(b.today || '');
      if (!DAY.test(today)) return json({ error: 'bad day' }, 400);
      const bars = Math.min(Math.max(parseInt(b.bars, 10) || 7, 1), 90);
      const range = Math.min(Math.max(parseInt(b.range, 10) || 7, 1), bars);
      const dev = ['pc', 'phone'].includes(b.dev) ? b.dev : 'all';       // which device(s) to show: both, only the PC, only the iPhone
      const dq = dev === 'phone' ? " AND device = 'iphone'" : dev === 'pc' ? " AND device != 'iphone'" : '';
      if (typeof b.tz === 'string' && b.tz.length < 60 && tzOk(b.tz)) {
        const old = await db.prepare('SELECT v FROM screentime_conf WHERE k = ?').bind('tz').first();
        if (!old || old.v !== b.tz) await setConf(db, 'tz', b.tz);
      }
      const barsFrom = shiftDay(today, -(bars - 1));
      const rangeFrom = shiftDay(today, -(range - 1));

      const rt = await db.prepare('SELECT day, SUM(seconds) AS seconds FROM screentime_runtime WHERE day >= ? AND day <= ?' + dq + ' GROUP BY day ORDER BY day').bind(barsFrom, today).all();
      const adj = dev === 'phone' ? { results: [] } : await db.prepare('SELECT id, day, seconds FROM screentime_adjust WHERE day >= ? AND day <= ? ORDER BY id').bind(barsFrom, today).all();   // adjustments are about the PC (AFK)
      const used = await db.prepare('SELECT app, SUM(seconds) AS seconds FROM screentime_usage WHERE day >= ? AND day <= ?' + dq + ' GROUP BY app').bind(rangeFrom, today).all();
      const days = await db.prepare('SELECT day, SUM(seconds) AS tracked, SUM(CASE WHEN app = ? THEN seconds ELSE 0 END) AS idle FROM screentime_usage WHERE day >= ? AND day <= ?' + dq + ' GROUP BY day').bind('(idle)', barsFrom, today).all();
      const apps = await db.prepare('SELECT app, counts, alive FROM screentime_apps').all();
      const devices = await db.prepare('SELECT device, last_seen FROM screentime_devices ORDER BY last_seen DESC').all();
      const hours = range === 1 ? (await db.prepare('SELECT hour, SUM(seconds) AS seconds FROM screentime_hourly WHERE day = ?' + dq + ' GROUP BY hour ORDER BY hour').bind(today).all()).results : [];
      const c = await getConf(db);

      const secs = {};
      for (const r of used.results) secs[r.app] = r.seconds;
      const list = apps.results
        .map((a) => ({ app: a.app, seconds: secs[a.app] || 0, counts: a.counts ? 1 : 0, alive: a.alive ? 1 : 0 }))
        .filter((a) => a.seconds > 0 || !a.counts || a.alive)
        .sort((x, y) => y.seconds - x.seconds || x.app.localeCompare(y.app))
        .slice(0, 150);

      return json({
        rt: rt.results, days: days.results, hours, adj: adj.results, apps: list, pseudo: used.results.filter((r) => r.app.startsWith('(')), devices: devices.results, now: Date.now(),
        conf: { idle: Math.round(c.idle / 60), overlay: c.overlay, corner: c.corner, opacity: c.opacity, desk: c.desk, idleCounts: c.idleCounts, breakOn: c.breakOn, breakMin: c.breakMin, colors: c.colors },
      });
    }

    if (api === 'set') {
      const b = await request.json().catch(() => ({}));

      if (b.idle !== undefined) {
        const m = Math.round(Number(b.idle));
        if (!(m >= 1 && m <= 240)) return json({ error: 'idle must be 1-240 minutes' }, 400);
        await setConf(db, 'idle', m * 60);
        return json({ ok: 1 });
      }
      if (b.overlay !== undefined) { await setConf(db, 'overlay', b.overlay ? 1 : 0); return json({ ok: 1 }); }
      if (b.desk !== undefined) { await setConf(db, 'desk', b.desk ? 1 : 0); return json({ ok: 1 }); }
      if (b.idleCounts !== undefined) { await setConf(db, 'idlecounts', b.idleCounts ? 1 : 0); return json({ ok: 1 }); }
      if (b.colors !== undefined) { await setConf(db, 'colors', b.colors ? 1 : 0); return json({ ok: 1 }); }
      if (b.breakOn !== undefined) { await setConf(db, 'breakon', b.breakOn ? 1 : 0); return json({ ok: 1 }); }
      if (b.breakMin !== undefined) {
        const m = Math.round(Number(b.breakMin));
        if (!(m >= 15 && m <= 480)) return json({ error: 'break must be 15-480 minutes' }, 400);
        await setConf(db, 'breakmin', m);
        return json({ ok: 1 });
      }
      if (b.corner !== undefined) {
        if (!CORNERS.includes(b.corner)) return json({ error: 'bad corner' }, 400);
        await setConf(db, 'corner', b.corner);
        return json({ ok: 1 });
      }
      if (b.opacity !== undefined) {
        const o = Math.round(Number(b.opacity));
        if (!(o >= 10 && o <= 100)) return json({ error: 'opacity must be 10-100' }, 400);
        await setConf(db, 'opacity', o);
        return json({ ok: 1 });
      }

      // subtract (negative minutes) or add (positive) time on one day
      if (b.adjDay !== undefined) {
        const m = Math.round(Number(b.adjMin));
        if (!DAY.test(String(b.adjDay)) || !m || Math.abs(m) > 1440) return json({ error: 'bad adjustment' }, 400);
        await db.prepare('INSERT INTO screentime_adjust (day, seconds, created) VALUES (?, ?, ?)').bind(String(b.adjDay), m * 60, Date.now()).run();
        return json({ ok: 1 });
      }
      if (b.delAdj !== undefined) {
        const id = parseInt(b.delAdj, 10);
        if (!(id >= 1)) return json({ error: 'bad id' }, 400);
        await db.prepare('DELETE FROM screentime_adjust WHERE id = ?').bind(id).run();
        return json({ ok: 1 });
      }

      const app = cleanApp(b.app);
      if (!app) return json({ error: 'no app' }, 400);
      const st = [db.prepare('INSERT OR IGNORE INTO screentime_apps (app) VALUES (?)').bind(app)];
      if (b.counts !== undefined) st.push(db.prepare('UPDATE screentime_apps SET counts = ? WHERE app = ?').bind(b.counts ? 1 : 0, app));
      if (b.alive !== undefined) st.push(db.prepare('UPDATE screentime_apps SET alive = ? WHERE app = ?').bind(b.alive ? 1 : 0, app));
      await db.batch(st);
      return json({ ok: 1 });
    }

    if (api === 'key') {                                              // the phone setup sheet copies this into the Shortcuts "Authorization" header
      if (!env.SCREENTIME_TOKEN) return text('Add the secret SCREENTIME_TOKEN in Cloudflare Pages (Settings -> Variables and Secrets), redeploy, then try again.', 503);
      return text('Bearer ' + env.SCREENTIME_TOKEN);
    }

    if (api === 'script') {
      if (!env.SCREENTIME_TOKEN) return text('Add the secret SCREENTIME_TOKEN in Cloudflare Pages (Settings -> Variables and Secrets), redeploy, then try again.', 503);
      const body = SCRIPT.split('__SERVER__').join(url.origin).split('__TOKEN__').join(env.SCREENTIME_TOKEN).replace(/\n/g, '\r\n');
      return text(body);
    }

    return json({ error: 'unknown' }, 404);
  } catch (e) {
    return json({ error: 'screen time unavailable' }, 500);
  }
}

// ======================================== THE PC PROGRAM (AutoHotkey v1.1) ========================================
// __SERVER__ and __TOKEN__ are filled in when the Screen Time screen's "Download PC script" button is used.
// Keep this text free of backticks and dollar-brace pairs (it sits inside a JS template string).
const SCRIPT = `; Screen Time tracker - AutoHotkey v1.1
; Put this file in the Windows Startup folder (Win+R, type shell:startup) so it starts with the PC.
; It writes NOTHING to your disk. When it starts it reads today's numbers and your settings from the site once,
; then it only sends:
;  - how long the PC has been on today (shown faintly in a screen corner; if the script is opened later than Windows
;    started, it catches up on the time it missed)
;  - every 5 seconds the program in front gets those seconds (program names like chrome.exe only, never titles or keys).
;    The one exception is a yes/no: when a browser window in front is showing YouTube, the seconds go to "youtube.com" instead of
;    "chrome.exe", so watching videos is kept apart from other browsing. The page title is only checked on this PC, never sent.
;  - after a long non-stop stretch (you choose how long on the site) the site sends a break reminder to your phone
; Totals go to the site once a minute. Your settings (overlay, idle time, which programs count ...) are checked on the
; site every 30 seconds, so everything is controlled from the Screen Time screen and nothing here needs editing.

#NoEnv
#SingleInstance Force
#Persistent
#KeyHistory 0
ListLines Off
Process, Priority, , Low

SERVER := "__SERVER__"
TOKEN := "__TOKEN__"
DEVICE := A_ComputerName
idleLimit := 300
ignore := "|lockapp.exe|logonui.exe|"
alive := "|"
showOverlay := 0
corner := "bl"
opacity := 55
deskOnly := 1
deskClear := 1
adjust := 0
breakOn := 1
breakMin := 120
ovShown := 0
ovLast := ""
usage := {}
streak := 0
idleRun := 0
warned := 0
breakPending := 0
rt := 0
rtSent := 0
hrs := {}
synced := 0
confTries := 0
lastTick := A_TickCount
today := A_YYYY . "-" . A_MM . "-" . A_DD

; close any other copy of this tracker that is still running (an old download such as "screentime (1).ahk" would keep counting the browser as chrome.exe)
KillOthers()

; the on-screen counter: plain white numbers, a little see-through, never takes clicks or focus, hidden from Alt-Tab.
; It is shown once the site says so, and (unless you turn that off on the site) only while no program window is open.
Gui, ST:New, -Caption +ToolWindow +E0x20 +E0x80 +HwndovHwnd
Gui, ST:Margin, 0, 0
Gui, ST:Color, FEFEFE
Gui, ST:Font, s10 w600, Segoe UI
Gui, ST:Add, Text, vovTxt cFFFFFF +BackgroundTrans Center w76 h20, 0h 00m
; make the window see-through BEFORE it is ever shown, so a plain box can never appear: only the white numbers are visible
Gui, ST:Show, Hide x0 y0 w76 h20 NoActivate
WinSet, TransColor, FEFEFE 140, ahk_id %ovHwnd%

Menu, Tray, Tip, Screen Time
Menu, Tray, NoStandard
Menu, Tray, Add, Send now, SendNow
Menu, Tray, Add, Test YouTube (5 s), TestYT
Menu, Tray, Add, Quit, QuitApp
OnExit, ExitSub

SetTimer, Tick, 5000
SetTimer, FlushTimer, 60000
SetTimer, ConfTimer, 30000
SetTimer, FirstConf, -300
SetTimer, DeskTimer, 1000
return

Tick:
Critical
now := A_TickCount
gap := (now - lastTick) / 1000
lastTick := now
d := A_YYYY . "-" . A_MM . "-" . A_DD
if (d != today)
    NewDay(d)
if (gap > 30) {
    if (gap >= 300) {
        streak := 0
        idleRun := 0
        warned := 0
    }
    return
}
rt += gap
hk := d . "|" . (A_Hour + 0)
hrs[hk] := (hrs.HasKey(hk) ? hrs[hk] : 0) + gap
WinGet, exe, ProcessName, A
StringLower, exe, exe
exe := SiteName(exe)
TrackApp(gap, exe)
Streak(gap, exe)
UpdateOverlay()
return

DeskTimer:
if (showOverlay && deskOnly) {
    c := DesktopClear()
    if (c != deskClear) {
        deskClear := c
        ApplyOverlay()
    }
}
return

FlushTimer:
SendNow:
DoFlush()
return

ConfTimer:
GetConf()
return

FirstConf:
if (GetConf()) {
    DoFlush()
} else {
    confTries += 1
    if (confTries < 12)
        SetTimer, FirstConf, -5000
}
return

QuitApp:
ExitApp
return

ExitSub:
DoFlush()
ExitApp
return

; tray -> "Test YouTube": click the browser window within 5 seconds, then it shows what the script sees there
TestYT:
ToolTip, Click the browser window now - checking in 5 seconds
SetTimer, DoTestYT, -5000
return

DoTestYT:
ToolTip
WinGet, tp, ProcessName, A
StringLower, tp, tp
WinGetTitle, tt, A
tr := SiteName(tp)
MsgBox, 0, Screen Time test, % "program: " . tp . Chr(10) . "title: " . tt . Chr(10) . "counted as: " . tr
return

; ends every other running copy of this tracker (any AutoHotkey process whose command line mentions screentime)
KillOthers() {
    me := DllCall("GetCurrentProcessId")
    try {
        for proc in ComObjGet("winmgmts:").ExecQuery("Select ProcessId, CommandLine from Win32_Process where Name like 'AutoHotkey%'") {
            if (proc.ProcessId = me)
                continue
            if InStr(proc.CommandLine, "screentime")
                Process, Close, % proc.ProcessId
        }
    } catch e {
    }
}

; a browser window that is showing YouTube counts as "youtube.com", every other browser window keeps its program name
SiteName(exe) {
    if (exe != "chrome.exe" && exe != "msedge.exe" && exe != "firefox.exe" && exe != "brave.exe" && exe != "opera.exe" && exe != "vivaldi.exe")
        return exe
    WinGetTitle, ttl, A
    if RegExMatch(ttl, "(^|- )YouTube( and [0-9]+ more pages?)?( [^A-Za-z0-9]|$)")
        return "youtube.com"
    return exe
}

IsInt(v) {
    return RegExMatch(v, "^-?[0-9]+$")
}

; non-stop use: counts while you are really using the PC; 5 minutes without that is a break and starts over.
; When the streak reaches the limit set on the site, the site is told once (then again after each further limit).
Streak(gap, exe) {
    global streak, idleRun, warned, breakOn, breakMin, breakPending, idleLimit, alive
    act := (A_TimeIdlePhysical <= idleLimit * 1000) || (exe != "" && InStr(alive, "|" . exe . "|"))
    if (act) {
        streak += gap
        idleRun := 0
        if (breakOn && streak >= (warned + 1) * breakMin * 60) {
            warned += 1
            breakPending := Round(streak / 60)
            DoFlush()
        }
    } else {
        idleRun += gap
        if (idleRun >= 300) {
            streak := 0
            warned := 0
        }
    }
}

; every 5 seconds the seconds go to the program in front, or to "(idle)" when nobody has used the PC for longer than the idle limit
TrackApp(gap, exe) {
    global ignore, alive, idleLimit
    if (A_TimeIdlePhysical > idleLimit * 1000 && !InStr(alive, "|" . exe . "|")) {
        Bump("(idle)", gap)
        return
    }
    if (exe = "")
        return
    if InStr(ignore, "|" . exe . "|")
        return
    Bump(exe, gap)
}

Bump(name, gap) {
    global usage
    key := A_YYYY . "-" . A_MM . "-" . A_DD . "|" . name
    usage[key] := (usage.HasKey(key) ? usage[key] : 0) + gap
}

; the PC stayed on past midnight: a new day starts at zero
NewDay(d) {
    global today, rt, rtSent, adjust
    DoFlush()
    today := d
    rt := 0
    rtSent := 0
    adjust := 0
}

; seconds since this Windows session started (log-in time; falls back to Windows' own uptime)
SessionSecs() {
    secs := A_TickCount / 1000
    best := 0
    try {
        for proc in ComObjGet("winmgmts:").ExecQuery("Select CreationDate from Win32_Process where Name='explorer.exe'") {
            cd := SubStr(proc.CreationDate, 1, 14)
            d := A_Now
            EnvSub, d, %cd%, Seconds
            if (d > best)
                best := d
        }
    } catch e {
    }
    if (best > 0)
        secs := best
    return secs
}

UpdateOverlay() {
    global rt, adjust, ovLast
    total := rt + adjust
    if (total < 0)
        total := 0
    s := Floor(total)
    m := Mod(s // 60, 60)
    txt := (s // 3600) . "h " . SubStr("00" . m, -1) . "m"
    if (txt != ovLast) {
        GuiControl, ST:, ovTxt, %txt%
        ovLast := txt
    }
}

; true when no program window is showing (everything closed or minimised): only the desktop and taskbar are left
DesktopClear() {
    global ovHwnd
    SysGet, pm, Monitor
    WinGet, ids, List
    Loop, %ids% {
        id := ids%A_Index%
        if (id = ovHwnd)
            continue
        WinGet, mm, MinMax, ahk_id %id%
        if (mm = -1)
            continue
        WinGet, st, Style, ahk_id %id%
        if !(st & 0x10000000)
            continue
        WinGet, ex, ExStyle, ahk_id %id%
        if (ex & 0x80 || ex & 0x20 || ex & 0x08000000)
            continue
        WinGetClass, cls, ahk_id %id%
        if (cls = "Progman" || cls = "WorkerW" || cls = "Shell_TrayWnd" || cls = "Shell_SecondaryTrayWnd")
            continue
        WinGetPos, wx, wy, w, h, ahk_id %id%
        if (w < 40 || h < 40)
            continue
        ; only windows on the screen where the counter sits matter (the main monitor); other monitors are ignored
        cx := wx + w // 2
        cy := wy + h // 2
        if (cx < pmL || cx >= pmR || cy < pmT || cy >= pmB)
            continue
        cloaked := 0
        DllCall("dwmapi\\DwmGetWindowAttribute", "Ptr", id, "UInt", 14, "UInt*", cloaked, "UInt", 4)
        if (cloaked)
            continue
        return 0
    }
    return 1
}

ApplyOverlay() {
    global showOverlay, corner, opacity, ovHwnd, ovShown, deskOnly, deskClear
    if (!showOverlay || (deskOnly && !deskClear)) {
        if (ovShown)
            Gui, ST:Hide
        ovShown := 0
        return
    }
    SysGet, wa, MonitorWorkArea
    w := 76
    h := 20
    x := (corner = "bl" || corner = "tl") ? waLeft + 8 : waRight - w - 8
    y := (corner = "bl" || corner = "br") ? waBottom - h - 6 : waTop + 6
    a := Round(opacity * 2.55)
    Gui, ST:Show, x%x% y%y% w%w% h%h% NoActivate
    WinSet, TransColor, FEFEFE %a%, ahk_id %ovHwnd%
    ovShown := 1
}

DoFlush() {
    global usage, rt, rtSent, today, DEVICE, breakPending, synced, hrs
    Critical
    body := ""
    sent := {}
    hsent := {}
    if (synced) {
        for hkey, hsecs in hrs {
            hw := Floor(hsecs)
            if (hw < 1)
                continue
            hp := StrSplit(hkey, "|")
            body .= "H" . Chr(9) . hp[1] . Chr(9) . hp[2] . Chr(9) . hw . Chr(10)
            hsent[hkey] := hw
        }
    }
    rtWhole := 0
    if (synced)
        rtWhole := Floor(rt - rtSent)
    if (rtWhole >= 1)
        body .= "R" . Chr(9) . today . Chr(9) . rtWhole . Chr(10)
    if (breakPending > 0)
        body .= "B" . Chr(9) . breakPending . Chr(10)
    for key, secs in usage {
        whole := Floor(secs)
        if (whole < 1)
            continue
        parts := StrSplit(key, "|")
        body .= parts[1] . Chr(9) . parts[2] . Chr(9) . whole . Chr(10)
        sent[key] := whole
    }
    if (body = "")
        return
    r := Http("POST", "/screentime?api=push&device=" . DEVICE, body)
    if (r != "ok")
        return
    if (rtWhole >= 1)
        rtSent += rtWhole
    for hkey, hw in hsent
        hrs[hkey] := hrs[hkey] - hw
    breakPending := 0
    nowDay := A_YYYY . "-" . A_MM . "-" . A_DD
    for key, whole in sent {
        usage[key] := usage[key] - whole
        if (usage[key] < 1 && SubStr(key, 1, 10) != nowDay)
            usage.Remove(key)
    }
}

; reads your settings and today's numbers from the site. The first successful read also does the catch-up for the counter.
GetConf() {
    global idleLimit, ignore, alive, showOverlay, corner, opacity, adjust, rt, rtSent, synced, today, DEVICE, breakOn, breakMin, deskOnly, hrs
    Critical
    r := Http("GET", "/screentime?api=conf&day=" . today . "&device=" . DEVICE)
    if (r = "")
        return 0
    newIgnore := "|lockapp.exe|logonui.exe|"
    newAlive := "|"
    serverRt := 0
    ago := -1
    for i, line in StrSplit(r, Chr(10), Chr(13)) {
        p := InStr(line, "=")
        if (p < 2)
            continue
        k := SubStr(line, 1, p - 1)
        v := SubStr(line, p + 1)
        if (k = "ignore") {
            newIgnore .= v . "|"
        } else if (k = "alive") {
            newAlive .= v . "|"
        } else if (IsInt(v)) {
            n := v + 0
            if (k = "idle" && n >= 30 && n <= 14400)
                idleLimit := n
            else if (k = "overlay")
                showOverlay := (n ? 1 : 0)
            else if (k = "opacity" && n >= 10 && n <= 100)
                opacity := n
            else if (k = "desk")
                deskOnly := (n ? 1 : 0)
            else if (k = "breakon")
                breakOn := (n ? 1 : 0)
            else if (k = "breakmin" && n >= 15 && n <= 480)
                breakMin := n
            else if (k = "adjust")
                adjust := n
            else if (k = "runtime")
                serverRt := n
            else if (k = "lastseenago")
                ago := n
        } else if (k = "corner" && (v = "bl" || v = "br" || v = "tl" || v = "tr")) {
            corner := v
        }
    }
    ignore := newIgnore
    alive := newAlive
    if (!synced) {
        ; today so far = what the site already has + the time since the site last heard from this PC.
        ; If the site last heard from it before this Windows session began, it is the whole session so far instead.
        sinceMid := A_Hour * 3600 + A_Min * 60 + A_Sec
        sessSecs := SessionSecs()
        cover := (sessSecs < sinceMid) ? sessSecs : sinceMid
        add := cover
        if (ago >= 0 && ago <= sessSecs && ago < add)
            add := ago
        rt := serverRt + add
        rtSent := serverRt
        ; spread the caught-up time backwards over the hours it belongs to
        left := add
        hh := A_Hour + 0
        avail := A_Min * 60 + A_Sec
        while (left > 0 && hh >= 0) {
            take := (left < avail) ? left : avail
            hk := today . "|" . hh
            hrs[hk] := (hrs.HasKey(hk) ? hrs[hk] : 0) + take
            left -= take
            hh -= 1
            avail := 3600
        }
        synced := 1
    }
    ApplyOverlay()
    UpdateOverlay()
    return 1
}

Http(method, path, body := "") {
    global SERVER, TOKEN
    try {
        req := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        req.SetTimeouts(4000, 4000, 8000, 8000)
        req.Open(method, SERVER . path, false)
        req.SetRequestHeader("Authorization", "Bearer " . TOKEN)
        req.SetRequestHeader("Content-Type", "text/plain")
        req.Send(body)
        if (req.Status = 200)
            return req.ResponseText
    } catch e {
    }
    return ""
}
`;
