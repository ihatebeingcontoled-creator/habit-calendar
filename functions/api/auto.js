// functions/api/auto.js  ->  /api/auto      (the Test tab "Automate" dashboard: saves its settings + word lists in D1)
//
//   GET  ?key=cfg|lists        -> { value: <saved JSON or null>, updated: "<iso time>" }
//   POST ?key=cfg|lists        body: { value: <any JSON> }  -> { ok: true }
//
// Why D1: the same settings then show up on your PC and your phone, and survive clearing the browser.
// The page also keeps a copy in the browser, so it still works if this call fails.
// Needs only the D1 binding DB that the site already has. The table is created automatically.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const KEYS = ['cfg', 'lists'];
const MAX = 400000;       // characters per saved value
let ready = null;
function ensure(db) {
  if (!ready) ready = db.prepare('CREATE TABLE IF NOT EXISTS auto_store (k TEXT PRIMARY KEY, v TEXT, updated TEXT)').run();
  return ready;
}

export async function onRequestGet({ request, env }) {
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

export async function onRequestPost({ request, env }) {
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
