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

export async function onRequestGet({ env }) {
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
      });
    }
    return json(out);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestPost({ request, env }) {
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
             (id, dateKey, startMinutes, durationMinutes, type, color, description, manualLeftPx, manualWidthPx, notify)
             VALUES (?,?,?,?,?,?,?,?,?,?)`
          ).bind(
            ev.id, dateKey, ev.startMinutes, ev.durationMinutes,
            ev.type || '', ev.color || '', ev.description || '',
            ev.manualLeftPx ?? null, ev.manualWidthPx ?? null, ev.notify ? 1 : 0
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
