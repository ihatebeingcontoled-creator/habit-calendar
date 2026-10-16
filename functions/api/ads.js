// functions/api/ads.js  ->  /api/ads   (uses your D1 binding named DB)
//
// Two things live here, picked with ?resource=
//
//   days  = the Ads calendar (what kind of ad you did on each date)
//     GET    /api/ads?resource=days                  -> { days: [{ date, kind, count }] }
//     POST   /api/ads?resource=days   {date, kind, count}
//            kind = 'poster' | 'video' | 'none'  ('none' just clears the day)
//
//   bank  = the poster Bank (saved posters: image + title + description + used/not used)
//     GET    /api/ads?resource=bank                  -> { items: [{ id, title, description, used, thumb, created_at }] }
//     GET    /api/ads?resource=bank&id=5             -> { item: { ...same, image } }   (full-size image)
//     POST   /api/ads?resource=bank   {title, description, image, thumb}          -> creates one
//     POST   /api/ads?resource=bank&id=5   {title?, description?, used?, image?, thumb?} -> edits one
//     DELETE /api/ads?resource=bank&id=5
//
//   orig  = the ORIGINAL, untouched photo for a bank item (exact bytes you uploaded, no shrinking).
//           The file itself lives in R2 (binding ADS_IMAGES -> bucket trade-journal-images, key ads-originals/<id>);
//           D1 only keeps a tiny marker row so the list can say has_orig = 1.
//     POST   /api/ads?resource=orig&id=5     raw file as the body (Content-Type = the photo's type, X-Orig-Name = file name)
//     GET    /api/ads?resource=orig&id=5     -> the original file itself
//     GET    /api/ads?resource=orig&id=5&idx=0  -> (legacy) a base64 piece saved by the earlier D1-only version
//
// The tables are created automatically the first time this runs, so there is NO sql file to run.

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

let schemaReady = null;
function ensureSchema(db) {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.prepare(`CREATE TABLE IF NOT EXISTS ads_days (
      date  TEXT PRIMARY KEY,
      kind  TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS ads_bank (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image       TEXT DEFAULT '',
      thumb       TEXT DEFAULT '',
      used        INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS ads_bank_orig (
      bank_id INTEGER NOT NULL,
      idx     INTEGER NOT NULL,
      total   INTEGER NOT NULL,
      mime    TEXT DEFAULT '',
      name    TEXT DEFAULT '',
      data    TEXT NOT NULL,
      PRIMARY KEY (bank_id, idx))`).run();
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const META = 'id, title, description, used, thumb, created_at, ' +
  '(SELECT CASE WHEN COUNT(*) = MAX(total) THEN 1 ELSE 0 END FROM ads_bank_orig o WHERE o.bank_id = ads_bank.id) AS has_orig';
const MAX_ORIG = 30 * 1024 * 1024;           // 30 MB per photo
const R2_KEY = (id) => 'ads-originals/' + id;   // its own folder inside the bucket, away from the trade photos
const okImg = (s, max) => typeof s === 'string' && s.startsWith('data:image/') && s.length <= max;

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);
  try { await ensureSchema(db); } catch (e) { return json({ error: 'schema: ' + e.message }, 500); }

  const url = new URL(request.url);
  const resource = url.searchParams.get('resource') || 'days';
  const id = Number(url.searchParams.get('id')) || 0;

  /* ---------------- calendar days ---------------- */
  if (resource === 'days') {
    if (request.method === 'GET') {
      const { results } = await db.prepare('SELECT date, kind, count FROM ads_days ORDER BY date').all();
      return json({ days: results });
    }
    if (request.method === 'POST') {
      let b; try { b = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }
      if (!DATE_RE.test(b.date || '')) return json({ error: 'bad date' }, 400);
      if (b.kind === 'none') {
        await db.prepare('DELETE FROM ads_days WHERE date = ?').bind(b.date).run();
        return json({ ok: true });
      }
      if (b.kind !== 'poster' && b.kind !== 'video') return json({ error: 'bad kind' }, 400);
      const count = Math.min(999, Math.max(1, Math.round(Number(b.count) || 1)));
      await db.prepare(
        'INSERT INTO ads_days (date, kind, count) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET kind = excluded.kind, count = excluded.count'
      ).bind(b.date, b.kind, count).run();
      return json({ ok: true });
    }
    return json({ error: 'method not allowed' }, 405);
  }

  /* ---------------- bank ---------------- */
  if (resource === 'bank') {
    if (request.method === 'GET') {
      if (id) {
        const row = await db.prepare(`SELECT ${META}, image FROM ads_bank WHERE id = ?`).bind(id).first();
        return row ? json({ item: row }) : json({ error: 'not found' }, 404);
      }
      const { results } = await db.prepare(`SELECT ${META} FROM ads_bank ORDER BY id DESC`).all();
      return json({ items: results });
    }

    if (request.method === 'POST') {
      let b; try { b = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }
      if (b.image != null && b.image !== '' && !okImg(b.image, 1500000)) return json({ error: 'image too big or invalid' }, 400);
      if (b.thumb != null && b.thumb !== '' && !okImg(b.thumb, 120000)) return json({ error: 'thumbnail too big or invalid' }, 400);

      if (id) { // edit: only the fields that were sent
        const sets = [], vals = [];
        if (b.title != null)       { sets.push('title = ?');       vals.push(String(b.title).slice(0, 120)); }
        if (b.description != null) { sets.push('description = ?'); vals.push(String(b.description).slice(0, 4000)); }
        if (b.used != null)        { sets.push('used = ?');        vals.push(b.used ? 1 : 0); }
        if (b.image)               { sets.push('image = ?');       vals.push(b.image); }
        if (b.thumb)               { sets.push('thumb = ?');       vals.push(b.thumb); }
        if (!sets.length) return json({ error: 'nothing to change' }, 400);
        await db.prepare(`UPDATE ads_bank SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
        if (b.image) { // old original no longer matches the new photo
          await db.prepare('DELETE FROM ads_bank_orig WHERE bank_id = ?').bind(id).run();
          if (env.ADS_IMAGES) { try { await env.ADS_IMAGES.delete(R2_KEY(id)); } catch (e) {} }
        }
        const row = await db.prepare(`SELECT ${META} FROM ads_bank WHERE id = ?`).bind(id).first();
        return row ? json({ item: row }) : json({ error: 'not found' }, 404);
      }

      // create
      const r = await db.prepare(
        'INSERT INTO ads_bank (title, description, image, thumb, used) VALUES (?, ?, ?, ?, 0)'
      ).bind(
        String(b.title || '').slice(0, 120), String(b.description || '').slice(0, 4000),
        b.image || '', b.thumb || ''
      ).run();
      const newId = r.meta && r.meta.last_row_id;
      const row = await db.prepare(`SELECT ${META} FROM ads_bank WHERE id = ?`).bind(newId).first();
      return json({ item: row });
    }

    if (request.method === 'DELETE') {
      if (!id) return json({ error: 'id required' }, 400);
      await db.prepare('DELETE FROM ads_bank WHERE id = ?').bind(id).run();
      await db.prepare('DELETE FROM ads_bank_orig WHERE bank_id = ?').bind(id).run();
      if (env.ADS_IMAGES) { try { await env.ADS_IMAGES.delete(R2_KEY(id)); } catch (e) {} }
      return json({ ok: true });
    }
    return json({ error: 'method not allowed' }, 405);
  }

  /* ---------------- original (full-quality) photo ---------------- */
  if (resource === 'orig') {
    if (!id) return json({ error: 'id required' }, 400);

    if (request.method === 'GET') {
      // legacy: a base64 piece from the earlier D1-only version
      if (url.searchParams.has('idx')) {
        const idx = parseInt(url.searchParams.get('idx'), 10) || 0;
        const row = await db.prepare('SELECT idx, total, mime, name, data FROM ads_bank_orig WHERE bank_id = ? AND idx = ?').bind(id, idx).first();
        return row ? json(row) : json({ error: 'not found' }, 404);
      }
      // the file itself, straight from R2
      const m = await db.prepare("SELECT mime, name, (data = 'r2') AS is_r2 FROM ads_bank_orig WHERE bank_id = ? AND idx = 0").bind(id).first();
      if (!m || !m.is_r2) return json({ error: 'not found' }, 404);
      if (!env.ADS_IMAGES) return json({ error: 'R2 binding \"ADS_IMAGES\" not found' }, 500);
      const obj = await env.ADS_IMAGES.get(R2_KEY(id));
      if (!obj) return json({ error: 'not found' }, 404);
      return new Response(obj.body, {
        headers: { 'Content-Type': m.mime || 'image/jpeg', 'X-Orig-Name': encodeURIComponent(m.name || ''), 'Cache-Control': 'no-store' },
      });
    }

    if (request.method === 'POST') {
      if (!env.ADS_IMAGES) return json({ error: 'R2 binding \"ADS_IMAGES\" not found - add it in the Pages project settings' }, 500);
      const exists = await db.prepare('SELECT 1 AS x FROM ads_bank WHERE id = ?').bind(id).first();
      if (!exists) return json({ error: 'not found' }, 404);
      const buf = await request.arrayBuffer();
      if (!buf.byteLength) return json({ error: 'empty file' }, 400);
      if (buf.byteLength > MAX_ORIG) return json({ error: 'file over 30 MB' }, 413);
      const mime = (request.headers.get('Content-Type') || 'application/octet-stream').slice(0, 100);
      let name = ''; try { name = decodeURIComponent(request.headers.get('X-Orig-Name') || '').slice(0, 200); } catch (e) {}
      await env.ADS_IMAGES.put(R2_KEY(id), buf, { httpMetadata: { contentType: mime }, customMetadata: { name } });
      await db.prepare('DELETE FROM ads_bank_orig WHERE bank_id = ?').bind(id).run();
      await db.prepare("INSERT INTO ads_bank_orig (bank_id, idx, total, mime, name, data) VALUES (?, 0, 1, ?, ?, 'r2')").bind(id, mime, name).run();
      return json({ ok: true });
    }
    return json({ error: 'method not allowed' }, 405);
  }

  return json({ error: 'unknown resource' }, 400);
}
