/**
 * GET  /api/habits  → returns all habit entries as JSON (public, no auth)
 * POST /api/habits  → upserts an entry (open — anyone can edit, no auth)
 *
 * D1 binding name: DB
 *
 * D1 schema — run migrations in order via the D1 Console:
 *   1-create-table.sql      → base table
 *   2-seed-data.sql         → seed rows
 *   3-add-title-column.sql  → adds title
 *   4-create-files-table.sql→ files table
 *   5-add-new-columns.sql   → adds pullups + all skill columns + maxGreen
 *   6-add-breath-hold.sql   → adds breathHold column
 */

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

/* ── GET: return all entries as { 'YYYY-MM-DD': {...}, ... } ── */
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM habits').all();
    const out = {};
    for (const row of results) {
      out[row.date] = {
        date:                row.date,
        title:               row.title               ?? '',
        pushups:             !!row.pushups,
        pullups:             !!row.pullups,
        readPages:           !!row.readPages,
        skillCardTrick:      !!row.skillCardTrick,
        skillStretch:        !!row.skillStretch,
        skillLSit:           !!row.skillLSit,
        skillOneHandPushups: !!row.skillOneHandPushups,
        skillProductive:     !!row.skillProductive,
        breathHold:          !!row.breathHold,
        maxGreen:            !!row.maxGreen,
        nDay:                row.nDay  ?? '',
        nRead:               row.nRead ?? '',
      };
    }
    return json(out);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ── POST: upsert an entry (open — no auth) ── */
export async function onRequestPost({ request, env }) {
  try {
    const t = await request.json();
    if (!t.date) return json({ error: 'Missing date' }, 400);

    await env.DB.prepare(`
      INSERT INTO habits (
        date, title,
        pushups, pullups, readPages,
        skillCardTrick, skillStretch, skillLSit, skillOneHandPushups, skillProductive,
        breathHold,
        maxGreen,
        nDay, nRead
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        title               = excluded.title,
        pushups             = excluded.pushups,
        pullups             = excluded.pullups,
        readPages           = excluded.readPages,
        skillCardTrick      = excluded.skillCardTrick,
        skillStretch        = excluded.skillStretch,
        skillLSit           = excluded.skillLSit,
        skillOneHandPushups = excluded.skillOneHandPushups,
        skillProductive     = excluded.skillProductive,
        breathHold          = excluded.breathHold,
        maxGreen            = excluded.maxGreen,
        nDay                = excluded.nDay,
        nRead               = excluded.nRead
    `).bind(
      t.date,
      t.title               ?? '',
      t.pushups             ? 1 : 0,
      t.pullups             ? 1 : 0,
      t.readPages           ? 1 : 0,
      t.skillCardTrick      ? 1 : 0,
      t.skillStretch        ? 1 : 0,
      t.skillLSit           ? 1 : 0,
      t.skillOneHandPushups ? 1 : 0,
      t.skillProductive     ? 1 : 0,
      t.breathHold          ? 1 : 0,
      t.maxGreen            ? 1 : 0,
      t.nDay                ?? '',
      t.nRead               ?? '',
    ).run();

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
