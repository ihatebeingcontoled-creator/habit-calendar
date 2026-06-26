/**
 * GET  /api/habits  → returns all habit entries as JSON (public, no auth)
 * POST /api/habits  → upserts an entry (requires X-Admin-Password header)
 *
 * D1 binding name: DB
 * Expected env var: ADMIN_PASSWORD
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

export async function onRequestPost({ request, env }) {
  if (!isAuthed(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  try {
    const t = await request.json();
    if (!t.date) return json({ error: 'Missing date' }, 400);

    await env.DB.prepare(`
      INSERT INTO habits (
        date, title,
        pushups, pullups, readPages,
        skillCardTrick, skillStretch, skillLSit, skillOneHandPushups, skillProductive,
        maxGreen,
        nDay, nRead
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
