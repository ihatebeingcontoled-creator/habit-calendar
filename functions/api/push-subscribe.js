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

export async function onRequestPost({ request, env }) {
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
