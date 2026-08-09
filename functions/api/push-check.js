const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function zonedTimeToUtc(y, mo, d, h, mi, timeZone) {
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcGuess));
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const hour = map.hour === '24' ? '0' : map.hour;
  const asUtc = Date.UTC(
    parseInt(map.year), parseInt(map.month) - 1, parseInt(map.day),
    parseInt(hour), parseInt(map.minute), parseInt(map.second)
  );
  const offset = asUtc - utcGuess;
  return utcGuess - offset;
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

function pad(n) { return String(n).padStart(2, '0'); }

async function sendPush(sub, payloadObj, env) {
  const body = await encryptPayload(JSON.stringify(payloadObj), sub.p256dh, sub.auth);
  const authorization = await createVapidAuthHeader(
    sub.endpoint, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT
  );
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

export async function onRequestGet({ env }) {
  try {
    const nowMs = Date.now();
    const { results } = await env.DB.prepare(
      'SELECT * FROM habit_events WHERE notify = 1'
    ).all();

    const due = [];
    for (const ev of results) {
      const [y, mo, d] = ev.dateKey.split('-').map(Number);
      const hh = Math.floor(ev.startMinutes / 60);
      const mi = ev.startMinutes % 60;
      const eventMs = zonedTimeToUtc(y, mo, d, hh, mi, 'Europe/Vilnius');
      if (eventMs <= nowMs && eventMs > nowMs - 90 * 1000) {
        ev.timeLabel = `${pad(hh)}:${pad(mi)}`;
        due.push(ev);
      }
    }
    if (!due.length) return json({ ok: true, sent: 0 });

    const placeholders = due.map(() => '?').join(',');
    const { results: alreadySentRows } = await env.DB.prepare(
      `SELECT event_id FROM sent_notifications WHERE event_id IN (${placeholders})`
    ).bind(...due.map((e) => e.id)).all();
    const sentIds = new Set(alreadySentRows.map((r) => r.event_id));
    const toSend = due.filter((e) => !sentIds.has(e.id));
    if (!toSend.length) return json({ ok: true, sent: 0 });

    const { results: subs } = await env.DB.prepare('SELECT * FROM push_subscriptions').all();

    let sentCount = 0;
    const markStmts = [];
    for (const ev of toSend) {
      const payload = {
        title: ev.type || 'Reminder',
        body: ev.description ? `${ev.timeLabel} — ${ev.description}` : ev.timeLabel,
      };
      for (const sub of subs) {
        try {
          const res = await sendPush(sub, payload, env);
          if (res.status === 404 || res.status === 410) {
            await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
          } else {
            sentCount++;
          }
        } catch (err) {
          /* one bad subscription shouldn't block the rest */
        }
      }
      markStmts.push(
        env.DB.prepare('INSERT OR REPLACE INTO sent_notifications (event_id, sent_at) VALUES (?, ?)')
          .bind(ev.id, Date.now())
      );
    }
    if (markStmts.length) await env.DB.batch(markStmts);

    return json({ ok: true, sent: sentCount });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
