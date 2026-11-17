// functions/screentime.js  ->  https://<your site>/screentime
// ONE file for the whole Screen Time feature:
//   * the page            GET  /screentime                      (behind the normal site code gate)
//   * the page's data     POST /screentime?api=data | set | script   (behind the gate, uses your cookie)
//   * the PC program      POST /screentime?api=push   (the PC sends its seconds)
//                         GET  /screentime?api=conf   (the PC reads your settings)
//                         both need "Authorization: Bearer <SCREENTIME_TOKEN>" and are let through the gate by one line in _middleware.js
//   * the PC program itself (an AutoHotkey v1.1 script) is the SCRIPT text at the bottom; the page's "Download PC script" button
//     hands it out with your site address and token already filled in.
//
// Needs in Cloudflare Pages -> Settings -> Variables and Secrets:
//   SCREENTIME_TOKEN  (secret) — any long random text; it is baked into the downloaded PC script
// Uses the same D1 binding as the rest of the site: DB   (tables are created automatically, no sql to run)
//
// Settings (all changed on the page, picked up by the PC within ~5 minutes or at its next start):
//   idle minutes      no keyboard/mouse for this long -> time stops counting
//   Counts            off = that app is never counted (and its old time disappears from the totals)
//   Idle OK           on  = counts even without keyboard/mouse (videos, games with a controller, calls)
// POSTs are used for everything the page asks for on purpose: sw.js caches GETs, and these must never be cached.

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const text = (t, s = 200) => new Response(t, { status: s, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_IDLE = 300;   // seconds

let ready = null;
function ensure(db) {
  if (ready) return ready;
  ready = db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_usage (day TEXT NOT NULL, device TEXT NOT NULL, app TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, device, app))'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_apps (app TEXT PRIMARY KEY, counts INTEGER NOT NULL DEFAULT 1, alive INTEGER NOT NULL DEFAULT 0)'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_conf (k TEXT PRIMARY KEY, v TEXT)'),
    db.prepare('CREATE TABLE IF NOT EXISTS screentime_devices (device TEXT PRIMARY KEY, last_seen INTEGER)'),
  ]).catch((e) => { ready = null; throw e; });
  return ready;
}

function shiftDay(day, n) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const cleanApp = (a) => String(a || '').replace(/[\t\r\n|]/g, '').trim().toLowerCase().slice(0, 80);
const tokenOk = (request, env) => Boolean(env.SCREENTIME_TOKEN) && (request.headers.get('Authorization') || '') === 'Bearer ' + env.SCREENTIME_TOKEN;

async function getIdle(db) {
  const r = await db.prepare("SELECT v FROM screentime_conf WHERE k='idle'").first();
  const n = r ? parseInt(r.v, 10) : NaN;
  return n >= 30 ? n : DEFAULT_IDLE;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const api = url.searchParams.get('api');

  if (!api) {
    if (request.method !== 'GET') return text('Method not allowed', 405);
    return new Response(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  const db = env.DB;
  if (!db) return json({ error: 'no database (binding DB)' }, 500);

  try {
    await ensure(db);

    // ───────── from the PC (token) ─────────
    if (api === 'push') {
      if (request.method !== 'POST') return text('Method not allowed', 405);
      if (!tokenOk(request, env)) return text('Unauthorized', 401);
      const device = (url.searchParams.get('device') || 'pc').replace(/[^\w.\- ]/g, '').slice(0, 40) || 'pc';
      const lines = (await request.text()).split('\n').slice(0, 600);
      const st = [];
      for (const line of lines) {
        const [day, rawApp, rawSecs] = line.replace(/\r$/, '').split('\t');
        const app = cleanApp(rawApp);
        const secs = parseInt(rawSecs, 10);
        if (!DAY.test(day || '') || !app || !(secs >= 1)) continue;
        st.push(db.prepare('INSERT OR IGNORE INTO screentime_apps (app) VALUES (?)').bind(app));
        st.push(db.prepare('INSERT INTO screentime_usage (day, device, app, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(day, device, app) DO UPDATE SET seconds = seconds + excluded.seconds')
          .bind(day, device, app, Math.min(secs, 86400)));
      }
      st.push(db.prepare('INSERT INTO screentime_devices (device, last_seen) VALUES (?, ?) ON CONFLICT(device) DO UPDATE SET last_seen = excluded.last_seen').bind(device, Date.now()));
      await db.batch(st);
      return text('ok');
    }

    if (api === 'conf') {
      if (request.method !== 'GET') return text('Method not allowed', 405);
      if (!tokenOk(request, env)) return text('Unauthorized', 401);
      const idle = await getIdle(db);
      const { results } = await db.prepare('SELECT app, counts, alive FROM screentime_apps WHERE counts = 0 OR alive = 1').all();
      let out = 'idle=' + idle + '\n';
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
      const barsFrom = shiftDay(today, -(bars - 1));
      const rangeFrom = shiftDay(today, -(range - 1));

      const days = await db.prepare(
        'SELECT u.day AS day, SUM(u.seconds) AS seconds FROM screentime_usage u LEFT JOIN screentime_apps a ON a.app = u.app ' +
        'WHERE u.day >= ? AND u.day <= ? AND COALESCE(a.counts, 1) = 1 GROUP BY u.day ORDER BY u.day'
      ).bind(barsFrom, today).all();
      const used = await db.prepare('SELECT app, SUM(seconds) AS seconds FROM screentime_usage WHERE day >= ? AND day <= ? GROUP BY app').bind(rangeFrom, today).all();
      const apps = await db.prepare('SELECT app, counts, alive FROM screentime_apps').all();
      const devices = await db.prepare('SELECT device, last_seen FROM screentime_devices ORDER BY last_seen DESC').all();

      const secs = {};
      for (const r of used.results) secs[r.app] = r.seconds;
      const list = apps.results
        .map((a) => ({ app: a.app, seconds: secs[a.app] || 0, counts: a.counts ? 1 : 0, alive: a.alive ? 1 : 0 }))
        .filter((a) => a.seconds > 0 || !a.counts || a.alive)
        .sort((x, y) => y.seconds - x.seconds || x.app.localeCompare(y.app))
        .slice(0, 150);

      return json({ days: days.results, apps: list, devices: devices.results, now: Date.now(), idle: Math.round((await getIdle(db)) / 60) });
    }

    if (api === 'set') {
      const b = await request.json().catch(() => ({}));
      if (b.idle !== undefined) {
        const m = Math.round(Number(b.idle));
        if (!(m >= 1 && m <= 240)) return json({ error: 'idle must be 1-240 minutes' }, 400);
        await db.prepare("INSERT INTO screentime_conf (k, v) VALUES ('idle', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(String(m * 60)).run();
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

// ======================================== THE PAGE ========================================
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Screen Time</title>
<style>
:root{--bg:#f5f5f7;--card:#fff;--tx:#111;--mut:#6b6b73;--line:#e6e6ea;--acc:#0a84ff;--bar:#cfe4ff;--ok:#22a559}
@media(prefers-color-scheme:dark){:root{--bg:#000;--card:#1c1c1e;--tx:#f5f5f5;--mut:#9a9aa1;--line:#2c2c2e;--acc:#4da3ff;--bar:#1f3a57;--ok:#3ccf7a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:16px system-ui,-apple-system,sans-serif;padding:16px;display:flex;justify-content:center}
main{width:100%;max-width:720px;display:grid;gap:14px}
.card{background:var(--card);border-radius:18px;padding:16px 18px;box-shadow:0 4px 18px rgba(0,0,0,.05)}
h1{font-size:22px;margin:0}h2{font-size:15px;margin:0 0 10px}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mut{color:var(--mut);font-size:13px}
.tabs{display:flex;gap:6px}
.tabs button{border:0;border-radius:10px;padding:7px 14px;font:inherit;font-size:14px;background:var(--line);color:var(--tx);cursor:pointer}
.tabs button.on{background:var(--acc);color:#fff}
.big{font-size:40px;font-weight:700;letter-spacing:-1px;line-height:1.1}
.bars{display:flex;align-items:flex-end;gap:4px;height:120px;margin-top:14px}
.col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;min-width:0}
.col i{display:block;width:100%;background:var(--bar);border-radius:5px 5px 2px 2px;min-height:2px}
.col.today i{background:var(--acc)}
.col span{font-size:10px;color:var(--mut);margin-top:4px;height:12px}
.row{display:grid;grid-template-columns:1fr 64px 44px 44px;gap:8px;align-items:center;padding:9px 0;border-top:1px solid var(--line)}
.row.head{border-top:0;padding-top:0;color:var(--mut);font-size:12px}
.row.head div,.row .c{text-align:center}.row .t{text-align:right;font-variant-numeric:tabular-nums}
.name{min-width:0}.name b{display:block;font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meter{height:4px;border-radius:3px;background:var(--line);margin-top:5px}.meter i{display:block;height:100%;border-radius:3px;background:var(--acc)}
.off{opacity:.45}
input[type=checkbox]{width:20px;height:20px;accent-color:var(--acc)}
select,button.act{font:inherit;font-size:15px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--tx);padding:8px 12px}
button.act{background:var(--acc);color:#fff;border:0;font-weight:600;cursor:pointer}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--mut);margin-right:6px}.dot.on{background:var(--ok)}
details summary{cursor:pointer;font-weight:600}
ol{margin:10px 0 0;padding-left:20px;display:grid;gap:6px;font-size:14px}
code{background:var(--line);padding:1px 6px;border-radius:6px;font-size:13px}
.err{color:#dc2626;font-size:14px;margin-top:8px}
</style></head><body><main>
<div class="top"><div><a href="/" style="color:var(--acc);text-decoration:none;font-size:14px">&larr; Calendar</a><h1>Screen Time</h1></div><div class="tabs" id="tabs"><button data-r="1">Today</button><button data-r="7" class="on">7 days</button><button data-r="30">30 days</button></div></div>
<div class="card"><div class="mut" id="totLabel">Total</div><div class="big" id="total">…</div><div class="mut" id="avg"></div><div class="bars" id="bars"></div></div>
<div class="card"><h2>Apps</h2>
<div class="row head"><div>App</div><div style="text-align:right">Time</div><div>Counts</div><div title="Counts even with no keyboard or mouse">Idle OK</div></div>
<div id="apps"></div><div class="mut" id="appsEmpty" style="display:none">Nothing yet. Apps appear here as soon as the PC program sends its first minute.</div></div>
<div class="card"><h2>Settings</h2>
<div class="top"><div>Stop counting after no keyboard or mouse for</div>
<select id="idle"><option>1</option><option>2</option><option>3</option><option>5</option><option>10</option><option>15</option><option>30</option><option>60</option></select></div>
<div class="mut" style="margin-top:8px">minutes. Changes reach the PC within about 5 minutes. <b>Counts</b> off = the app is never counted. <b>Idle OK</b> on = counted even with no input (videos, calls, games).</div></div>
<div class="card"><h2>Computers</h2><div id="devices" class="mut">None yet</div>
<details id="setup" style="margin-top:12px"><summary>Set up the PC program</summary>
<ol><li>Install AutoHotkey <b>v1.1</b> (you already have it from your other scripts).</li>
<li><button class="act" id="dl">Download PC script</button></li>
<li>Press <code>Win + R</code>, type <code>shell:startup</code>, press Enter, and put <code>screentime.ahk</code> in that folder.</li>
<li>Double-click it once to start it now. From then on it starts with Windows.</li></ol><div class="err" id="dlErr"></div></details></div>
</main>
<script>
var range=7,last=null;
function $(i){return document.getElementById(i)}
function post(api,body){return fetch('/screentime?api='+api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}).then(function(r){if(!r.ok)throw new Error(r.status);return r})}
function pad(n){return n<10?'0'+n:''+n}
function dayStr(off){var d=new Date();d.setDate(d.getDate()-off);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function fmt(s){s=Math.round(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+'h '+m+'m':m+'m'}
function ago(ms){var s=Math.max(0,Math.round(ms/1000));if(s<90)return 'just now';if(s<5400)return Math.round(s/60)+' min ago';if(s<172800)return Math.round(s/3600)+' h ago';return Math.round(s/86400)+' days ago'}
function load(){
  var bars=Math.max(range,7);
  post('data',{today:dayStr(0),bars:bars,range:range}).then(function(r){return r.json()}).then(function(d){last=d;render(d,bars)}).catch(function(){$('total').textContent='offline'})
}
function render(d,bars){
  var by={};d.days.forEach(function(x){by[x.day]=x.seconds});
  var vals=[],i,sum=0,max=1;
  for(i=bars-1;i>=0;i--){var k=dayStr(i),v=by[k]||0;vals.push({k:k,v:v,i:i});if(i<range)sum+=v;if(v>max)max=v}
  $('total').textContent=fmt(sum);
  $('totLabel').textContent=range===1?'Today':'Last '+range+' days';
  $('avg').textContent=range>1?fmt(sum/range)+' per day on average':'';
  var b=$('bars');b.innerHTML='';
  vals.forEach(function(x){
    var c=document.createElement('div');c.className='col'+(x.i===0?' today':'');c.title=x.k+'  '+fmt(x.v);
    var bar=document.createElement('i');bar.style.height=Math.max(2,Math.round(x.v/max*100))+'%';
    var l=document.createElement('span');l.textContent=bars<=14?x.k.slice(8):'';
    c.appendChild(bar);c.appendChild(l);b.appendChild(c)});
  var top=1;d.apps.forEach(function(a){if(a.counts&&a.seconds>top)top=a.seconds});
  var box=$('apps');box.innerHTML='';
  d.apps.forEach(function(a){
    var row=document.createElement('div');row.className='row'+(a.counts?'':' off');
    var n=document.createElement('div');n.className='name';
    var nm=document.createElement('b');nm.textContent=a.app;n.appendChild(nm);
    var m=document.createElement('div');m.className='meter';var mi=document.createElement('i');mi.style.width=Math.round(a.seconds/top*100)+'%';m.appendChild(mi);n.appendChild(m);
    var t=document.createElement('div');t.className='t';t.textContent=a.seconds?fmt(a.seconds):'-';
    row.appendChild(n);row.appendChild(t);
    row.appendChild(box2(a,'counts'));row.appendChild(box2(a,'alive'));
    box.appendChild(row)});
  $('appsEmpty').style.display=d.apps.length?'none':'block';
  if(String($('idle').value)!==String(d.idle)){
    var has=false;Array.prototype.forEach.call($('idle').options,function(o){if(o.value===String(d.idle))has=true});
    if(!has){var o=document.createElement('option');o.textContent=d.idle;$('idle').appendChild(o)}
    $('idle').value=String(d.idle)}
  var dv=$('devices');
  if(!d.devices.length){dv.textContent='None yet';$('setup').open=true}
  else{dv.innerHTML='';d.devices.forEach(function(x){var p=document.createElement('div');var live=d.now-x.last_seen<180000;
    var dot=document.createElement('span');dot.className='dot'+(live?' on':'');p.appendChild(dot);
    p.appendChild(document.createTextNode(x.device+' - '+(live?'sending now':'last seen '+ago(d.now-x.last_seen))));dv.appendChild(p)})}
}
function box2(a,field){
  var w=document.createElement('div');w.className='c';var c=document.createElement('input');c.type='checkbox';c.checked=!!a[field];
  if(field==='alive'&&!a.counts)c.disabled=true;
  c.onchange=function(){var b={app:a.app};b[field]=c.checked;post('set',b).then(load).catch(function(){c.checked=!c.checked})};
  w.appendChild(c);return w}
$('tabs').onclick=function(e){var r=e.target.getAttribute&&e.target.getAttribute('data-r');if(!r)return;range=+r;
  Array.prototype.forEach.call($('tabs').children,function(x){x.className=x===e.target?'on':''});load()};
$('idle').onchange=function(){post('set',{idle:+$('idle').value}).catch(function(){})};
$('dl').onclick=function(){$('dlErr').textContent='';
  post('script').then(function(r){return r.blob()}).then(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='screentime.ahk';document.body.appendChild(a);a.click();a.remove()})
  .catch(function(){$('dlErr').textContent='Could not get the script. Check that the secret SCREENTIME_TOKEN is set in Cloudflare Pages and the site is redeployed.'})};
load();setInterval(function(){if(!document.hidden)load()},60000);
</script></body></html>`;

// ======================================== THE PC PROGRAM (AutoHotkey v1.1) ========================================
// __SERVER__ and __TOKEN__ are filled in when the page's "Download PC script" button is used. Keep this text free of backticks.
const SCRIPT = `; Screen Time tracker - AutoHotkey v1.1
; Put this file in the Windows Startup folder (Win+R, type shell:startup) so it starts with the PC.
; It looks at the front window every 5 seconds, adds the seconds to that program, and sends the totals
; to your site once a minute. Your settings (idle time, which apps count) are read from the site every 5 minutes.
; Window titles and keystrokes are never read or sent - only the program name (like chrome.exe) and seconds.

#NoEnv
#SingleInstance Force
#Persistent
#KeyHistory 0
ListLines Off
Process, Priority, , Low
SetWorkingDir %A_ScriptDir%

SERVER := "__SERVER__"
TOKEN := "__TOKEN__"
DEVICE := A_ComputerName
idleLimit := 300
ignore := "|lockapp.exe|logonui.exe|"
alive := "|"
usage := {}
lastTick := A_TickCount

Menu, Tray, Tip, Screen Time
Menu, Tray, NoStandard
Menu, Tray, Add, Send now, SendNow
Menu, Tray, Add, Quit, QuitApp
OnExit, ExitSub

SetTimer, Tick, 5000
SetTimer, FlushTimer, 60000
SetTimer, ConfTimer, 300000
SetTimer, FirstConf, -1500
return

Tick:
Critical
now := A_TickCount
gap := (now - lastTick) / 1000
lastTick := now
if (gap > 30)
    return
WinGet, exe, ProcessName, A
if (exe = "")
    return
StringLower, exe, exe
if InStr(ignore, "|" . exe . "|")
    return
if (A_TimeIdlePhysical > idleLimit * 1000 && !InStr(alive, "|" . exe . "|"))
    return
key := A_YYYY . "-" . A_MM . "-" . A_DD . "|" . exe
usage[key] := (usage.HasKey(key) ? usage[key] : 0) + gap
return

FlushTimer:
SendNow:
DoFlush()
return

ConfTimer:
FirstConf:
GetConf()
return

QuitApp:
ExitApp
return

ExitSub:
DoFlush()
ExitApp
return

DoFlush() {
    global usage
    Critical
    body := ""
    sent := {}
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
    today := A_YYYY . "-" . A_MM . "-" . A_DD
    for key, whole in sent {
        usage[key] := usage[key] - whole
        if (usage[key] < 1 && SubStr(key, 1, 10) != today)
            usage.Remove(key)
    }
}

GetConf() {
    global idleLimit, ignore, alive
    Critical
    r := Http("GET", "/screentime?api=conf")
    if (r = "")
        return
    newIgnore := "|lockapp.exe|logonui.exe|"
    newAlive := "|"
    for i, line in StrSplit(r, Chr(10), Chr(13)) {
        p := InStr(line, "=")
        if (p < 2)
            continue
        k := SubStr(line, 1, p - 1)
        v := SubStr(line, p + 1)
        if (k = "idle") {
            if v is integer
                if (v >= 30 && v <= 14400)
                    idleLimit := v
        } else if (k = "ignore")
            newIgnore .= v . "|"
        else if (k = "alive")
            newAlive .= v . "|"
    }
    ignore := newIgnore
    alive := newAlive
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
