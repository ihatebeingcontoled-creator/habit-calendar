// Cloudflare Pages Function: /api/money  (uses your D1 binding named DB)
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);
  await db.prepare(`CREATE TABLE IF NOT EXISTS money_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT DEFAULT '',
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const { results } = await db.prepare('SELECT id, date, amount, note, source FROM money_entries ORDER BY date, id').all();
    return json({ entries: results });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const rows = (Array.isArray(body) ? body : [body]).filter(r =>
      /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(Number(r.amount)));
    if (!rows.length) return json({ error: 'no valid rows' }, 400);
    const stmt = db.prepare('INSERT INTO money_entries (date, amount, note, source) VALUES (?, ?, ?, ?)');
    await db.batch(rows.map(r => stmt.bind(r.date, Number(r.amount), String(r.note || '').slice(0, 200), r.source || 'manual')));
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
