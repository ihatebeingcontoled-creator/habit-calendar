// functions/_middleware.js  —  access-code gate for the WHOLE site (pages + /api/*)
//
// Needs in Cloudflare Pages -> Settings -> Variables and Secrets:
//   code   (secret)  — the access code you type once on each device/browser
//
// How it works
//   * No valid cookie  -> every request gets a small "enter code" page (or a 401 for API calls).
//   * Right code       -> a cookie is saved for 1 year; the site opens straight away from then on.
//   * The cookie holds an HMAC of the code (not the code itself), so it cannot be used to read the code.
//   * If the "code" variable is missing the site stays LOCKED (fails closed) instead of opening to everyone.
//
// Left open on purpose (they are called by things that cannot hold a cookie):
//   /api/push-check        called by the outside cron job that sends notifications (it was already open before)
//   /api/spend             Apple Pay shortcut — only when it sends "Authorization: Bearer ...",
//                          and spend.js checks that token itself
//   /manifest.json, /favicon.png   Chrome fetches these without cookies (needed for "Add to home screen")

const COOKIE = 'site_access';
const LOGIN_PATH = '/__code';
const enc = new TextEncoder();

async function sign(code) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(code)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('habit-calendar-access-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function same(a, b) {            // constant-time string compare
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function page(message, status) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Enter code</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f5f7;font:16px system-ui,-apple-system,sans-serif;color:#111}
  form{background:#fff;padding:28px;border-radius:20px;box-shadow:0 8px 30px rgba(0,0,0,.08);width:min(320px,86vw);display:grid;gap:12px}
  h1{font-size:18px;margin:0}
  input{height:44px;border:1px solid #e2e2e6;border-radius:12px;padding:0 14px;font:inherit;background:#f7f7f9}
  input:focus{outline:none;border-color:#0a84ff;box-shadow:0 0 0 4px rgba(10,132,255,.15);background:#fff}
  button{height:44px;border:0;border-radius:12px;background:#111;color:#fff;font:inherit;font-weight:600;cursor:pointer}
  p{margin:0;color:#dc2626;font-size:14px}
  @media (prefers-color-scheme:dark){body{background:#000;color:#f5f5f5}form{background:#1c1c1e}input{background:#2c2c2e;border-color:#3a3a3c;color:#f5f5f5}button{background:#f5f5f5;color:#111}}
</style></head><body>
<form method="POST" action="${LOGIN_PATH}">
  <h1>Enter code</h1>
  <input type="password" name="code" autocomplete="current-password" autofocus required aria-label="Code">
  ${message ? `<p>${message}</p>` : ''}
  <button type="submit">Open</button>
</form></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const path = url.pathname;

  // things that must stay reachable without a cookie
  if (path === '/api/push-check') return next();
  if (path === '/api/spend' && /^Bearer\s/i.test(request.headers.get('Authorization') || '')) return next();
  if (path === '/manifest.json' || path === '/favicon.png') return next();

  if (!env.code) {
    return new Response('Site locked: the "code" variable is not set in Cloudflare Pages (Settings -> Variables and Secrets).',
      { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const expected = await sign(env.code);

  // submitting the code
  if (path === LOGIN_PATH && request.method === 'POST') {
    let given = '';
    try { given = String((await request.formData()).get('code') || ''); } catch (e) {}
    if (given && same(await sign(given), expected)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Cache-Control': 'no-store',
          'Set-Cookie': `${COOKIE}=${expected}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`,
        },
      });
    }
    await new Promise((r) => setTimeout(r, 800));          // slows down guessing
    return page('Wrong code.', 401);
  }

  // already allowed in?
  const have = readCookie(request, COOKIE);
  if (have && same(have, expected)) return next();

  // not allowed: pretty page for browsers, plain 401 for everything else
  const wantsPage = request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
  if (wantsPage) return page('', 401);
  return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}
