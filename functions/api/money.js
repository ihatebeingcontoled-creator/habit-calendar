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

export async function onRequest({ request, env }) {
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
