/**
 * GET  /api/habits  → returns all habit entries as JSON (public, no auth)
 * POST /api/habits  → upserts an entry (requires X-Admin-Password header)
 *
 * D1 binding name: DB
 * Expected env var: ADMIN_PASSWORD
 *
 * D1 schema (run once via Cloudflare dashboard or wrangler):
 *   CREATE TABLE IF NOT EXISTS habits (
 *     date      TEXT PRIMARY KEY,
 *     pushups   INTEGER DEFAULT 0,
 *     readPages INTEGER DEFAULT 0,
 *     nDay      TEXT,
 *     nRead     TEXT
 *   );
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function isAuthed(request, env) {
  return request.headers.get('X-Admin-Password') === env.ADMIN_PASSWORD;
}

/* ── GET: return all entries as { 'YYYY-MM-DD': {...}, ... } ── */
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM habits').all();
    const out = {};
    for (const row of results) {
      out[row.date] = {
        date:      row.date,
        pushups:   !!row.pushups,
        readPages: !!row.readPages,
        nDay:      row.nDay  ?? '',
        nRead:     row.nRead ?? '',
      };
    }
    return json(out);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ── POST: upsert an entry (admin only) ── */
export async function onRequestPost({ request, env }) {
  if (!isAuthed(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  try {
    const t = await request.json();
    if (!t.date) return json({ error: 'Missing date' }, 400);

    await env.DB.prepare(`
      INSERT INTO habits (date, pushups, readPages, nDay, nRead)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        pushups   = excluded.pushups,
        readPages = excluded.readPages,
        nDay      = excluded.nDay,
        nRead     = excluded.nRead
    `).bind(
      t.date,
      t.pushups   ? 1 : 0,
      t.readPages ? 1 : 0,
      t.nDay  ?? '',
      t.nRead ?? '',
    ).run();

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
