/**
 * POST /api/test-push
 *
 * Debugging endpoint: sends a push notification to every row in
 * push_subscriptions RIGHT NOW, bypassing all the event-timing logic
 * in push-check.js entirely. Returns a detailed per-subscription
 * report (HTTP status from the push service, or the exact error) so
 * we can see precisely what happens instead of guessing.
 *
 * Uses the exact same VAPID + aes128gcm encryption code as
 * push-check.js (kept duplicated here on purpose — see the MERGE
 * NOTE pattern in the other API files — so this stays a standalone,
 * always-safe-to-hit debug tool that can't accidentally break the
 * real send path).
 *
 * Requires the same env bindings as push-check.js:
 *   DB, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

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

function b64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBytes(...arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

async function hmacSha256(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return new Uint8Array(sig);
}

async function hkdf(salt, ikm, info, length) {
  const prk = await hmacSha256(salt, ikm);
  let t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  let counter = 1;
  while (okm.length < length) {
    const input = concatBytes(t, info, new Uint8Array([counter]));
    t = await hmacSha256(prk, input);
    okm = concatBytes(okm, t);
    counter++;
  }
  return okm.slice(0, length);
}

async function createVapidAuthHeader(endpoint, publicKeyB64, privateKeyB64, subject) {
  const pubBytes = b64urlToBytes(publicKeyB64);
  const x = pubBytes.slice(1, 33);
  const y = pubBytes.slice(33, 65);
  const d = b64urlToBytes(privateKeyB64);

  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: bytesToB64url(x), y: bytesToB64url(y), d: bytesToB64url(d),
    ext: true,
  };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

  const aud = new URL(endpoint).origin;
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject };

  const encHeader = bytesToB64url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${encHeader}.${encPayload}`;

  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${bytesToB64url(new Uint8Array(sigBuf))}`;

  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

async function encryptPayload(payloadText, p256dhB64, authB64) {
  const enc = new TextEncoder();
  const payload = enc.encode(payloadText);

  const receiverPublicBytes = b64urlToBytes(p256dhB64);
  const authSecret = b64urlToBytes(authB64);
  const receiverX = receiverPublicBytes.slice(1, 33);
  const receiverY = receiverPublicBytes.slice(33, 65);

  const receiverKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: bytesToB64url(receiverX), y: bytesToB64url(receiverY), ext: true },
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const localPublicJwk = await crypto.subtle.exportKey('jwk', localKeyPair.publicKey);
  const localPublicBytes = concatBytes(
    new Uint8Array([0x04]),
    b64urlToBytes(localPublicJwk.x),
    b64urlToBytes(localPublicJwk.y)
  );

  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverKey }, localKeyPair.privateKey, 256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const authInfo = concatBytes(enc.encode('WebPush: info\0'), receiverPublicBytes, localPublicBytes);
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);

  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const padded = concatBytes(payload, new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, padded)
  );

  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicBytes.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs, false);
  header[20] = localPublicBytes.length;
  header.set(localPublicBytes, 21);

  return concatBytes(header, ciphertext);
}

async function sendPush(sub, payloadObj, env) {
  let body;
  try {
    body = await encryptPayload(JSON.stringify(payloadObj), sub.p256dh, sub.auth);
  } catch (err) {
    err.step = 'encryptPayload (receiver p256dh/auth)';
    err.p256dhLen = (() => { try { return b64urlToBytes(sub.p256dh).length; } catch { return 'decode failed'; } })();
    err.authLen = (() => { try { return b64urlToBytes(sub.auth).length; } catch { return 'decode failed'; } })();
    throw err;
  }
  let authorization;
  try {
    authorization = await createVapidAuthHeader(
      sub.endpoint, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT
    );
  } catch (err) {
    err.step = 'createVapidAuthHeader (shared VAPID key)';
    throw err;
  }
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '60',
      'Authorization': authorization,
    },
    body,
  });
}

export async function onRequestPost({ env }) {
  const report = { ok: true, subscriptions: 0, results: [] };

  try {
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
      return json({
        ok: false,
        error: 'Missing VAPID env vars on this Pages project (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT). ' +
               'These must be set in the Pages project settings, not just the cron worker.',
      }, 500);
    }
    if (!env.DB) {
      return json({ ok: false, error: 'Missing DB binding on this Pages project.' }, 500);
    }

    const { results: subs } = await env.DB.prepare('SELECT * FROM push_subscriptions').all();
    report.subscriptions = subs.length;

    // Sanity-check the VAPID keys themselves before ever touching a
    // subscription — this is the one thing shared across every push,
    // so if it's malformed, every send fails identically regardless
    // of recipient (which is exactly what we're seeing).
    try {
      const pubBytes = b64urlToBytes(env.VAPID_PUBLIC_KEY);
      const privBytes = b64urlToBytes(env.VAPID_PRIVATE_KEY);
      report.vapidCheck = {
        publicKeyDecodedBytes: pubBytes.length,   // must be exactly 65
        publicKeyFirstByteHex: pubBytes.length ? pubBytes[0].toString(16) : null, // must be '4'
        privateKeyDecodedBytes: privBytes.length, // must be exactly 32
        publicKeyRawLength: env.VAPID_PUBLIC_KEY.length,
        privateKeyRawLength: env.VAPID_PRIVATE_KEY.length,
        publicKeyHasWhitespace: /\s/.test(env.VAPID_PUBLIC_KEY),
        privateKeyHasWhitespace: /\s/.test(env.VAPID_PRIVATE_KEY),
      };
    } catch (err) {
      report.vapidCheck = { error: 'Could not even base64-decode the VAPID keys: ' + err.message };
    }

    if (!subs.length) {
      report.ok = false;
      report.error = 'No rows in push_subscriptions at all. That means no device has ever successfully subscribed — ' +
                      'the browser never completed pushManager.subscribe() + POST to /api/push-subscribe, ' +
                      'or every subscription was previously deleted after a 404/410. Toggle the notify bell off ' +
                      'then on for any event to force a fresh subscribe attempt, then try this test again.';
      return json(report);
    }

    const payload = { title: 'Test notification', body: 'If you see this, push delivery works.' };

    for (const sub of subs) {
      const entry = { id: sub.id, endpoint: sub.endpoint.slice(0, 60) + '...' };
      try {
        const res = await sendPush(sub, payload, env);
        entry.status = res.status;
        if (res.status === 201 || res.status === 200) {
          entry.result = 'sent';
        } else if (res.status === 404 || res.status === 410) {
          entry.result = 'expired subscription — deleting from DB';
          await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
        } else {
          entry.result = 'unexpected status';
          try { entry.body = (await res.text()).slice(0, 300); } catch {}
        }
      } catch (err) {
        entry.result = 'threw an error';
        entry.error = err && err.message ? err.message : String(err);
        entry.failedAt = err && err.step ? err.step : 'unknown';
        if (err && err.p256dhLen !== undefined) entry.p256dhDecodedBytes = err.p256dhLen; // must be 65
        if (err && err.authLen !== undefined) entry.authDecodedBytes = err.authLen;       // must be 16
      }
      report.results.push(entry);
    }

    return json(report);
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
