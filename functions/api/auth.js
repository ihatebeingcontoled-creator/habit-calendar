/**
 * POST /api/auth
 * Body: { password: string }
 * Returns 200 if password matches ADMIN_PASSWORD env var, 401 otherwise.
 * No data is read or written — purely an auth check.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();
    if (password && password === env.ADMIN_PASSWORD) {
      return new Response('OK', { status: 200, headers: CORS });
    }
    return new Response('Unauthorized', { status: 401, headers: CORS });
  } catch {
    return new Response('Bad request', { status: 400, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
