/**
 * /api/files  — file attachments stored as base64 in D1
 *
 *  GET    /api/files              → all files grouped by date (metadata only, no `data` column)
 *                                    returns { 'YYYY-MM-DD': [ {id, name, type, size, uploaded}, ... ] }
 *  GET    /api/files?id=N         → downloads that single file with the correct Content-Type
 *  POST   /api/files              → upload (open — anyone can upload)
 *                                    Body JSON: { date, name, type, data (base64) }
 *  DELETE /api/files?id=N         → delete (open — anyone can delete)
 *
 *  Requires:
 *    DB              → D1 binding (same one used by habits.js)
 *    Run 4-create-files-table.sql in the D1 console once before using this.
 *
 *  Files are capped at 500KB raw on upload — server enforces it.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_RAW_BYTES = 500 * 1024;          // 500 KB
const DATE_RE       = /^\d{4}-\d{2}-\d{2}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function sanitizeName(name) {
  return String(name)
    .replace(/[^a-zA-Z0-9._\- ]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'file';
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function approxRawBytes(b64) {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor(b64.length * 3 / 4) - padding;
}

/* ───────── GET: list all (metadata) OR single download ───────── */
export async function onRequestGet({ request, env }) {
  const url     = new URL(request.url);
  const idParam = url.searchParams.get('id');

  if (idParam) {
    const id = parseInt(idParam, 10);
    if (!Number.isInteger(id) || id < 1) {
      return new Response('Bad id', { status: 400, headers: CORS });
    }
    const row = await env.DB.prepare(
      'SELECT name, type, data FROM files WHERE id = ?'
    ).bind(id).first();
    if (!row) return new Response('Not found', { status: 404, headers: CORS });

    let bytes;
    try { bytes = b64ToBytes(row.data); }
    catch { return new Response('Corrupted file', { status: 500, headers: CORS }); }

    return new Response(bytes, {
      headers: {
        'Content-Type':  row.type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...CORS,
      },
    });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, date, name, type, size, uploaded FROM files ORDER BY uploaded DESC'
    ).all();

    const grouped = {};
    for (const row of results) {
      if (!grouped[row.date]) grouped[row.date] = [];
      grouped[row.date].push({
        id:       row.id,
        name:     row.name,
        type:     row.type || '',
        size:     row.size || 0,
        uploaded: row.uploaded,
      });
    }
    return json(grouped);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ───────── POST: upload (open to anyone) ───────── */
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { date, name, type, data } = body || {};

    if (!date || !DATE_RE.test(date)) return json({ error: 'Bad or missing date' }, 400);
    if (!name)                        return json({ error: 'Missing name' }, 400);
    if (!data || typeof data !== 'string') return json({ error: 'Missing data' }, 400);

    const raw = approxRawBytes(data);
    if (raw > MAX_RAW_BYTES) {
      return json({ error: 'File too large — 500KB max per file.' }, 413);
    }

    const safeName = sanitizeName(name);
    const uploaded = new Date().toISOString();
    const mime     = (type && typeof type === 'string')
      ? type.slice(0, 100)
      : 'application/octet-stream';

    const result = await env.DB.prepare(
      'INSERT INTO files (date, name, type, size, data, uploaded) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(date, safeName, mime, raw, data, uploaded).run();

    const id = result.meta?.last_row_id;
    return json({ ok: true, id, name: safeName, type: mime, size: raw, uploaded });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ───────── DELETE (open to anyone) ───────── */
export async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    const id  = parseInt(url.searchParams.get('id'), 10);
    if (!Number.isInteger(id) || id < 1) return json({ error: 'Bad id' }, 400);

    await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
