/**
 * GET    /api/habits                       → returns all habit entries as JSON
 * POST   /api/habits                       → upserts an entry
 * GET    /api/habits?resource=targets      → returns all target history rows
 * POST   /api/habits?resource=targets      → adds/updates a target ({field, value, effectiveFrom})
 * DELETE /api/habits?resource=targets&id=  → removes one target history row
 *
 * D1 binding name: DB
 *
 * D1 schema — run migrations in order via the D1 Console:
 *   1-create-table.sql        → base table
 *   2-seed-data.sql           → seed rows
 *   3-add-title-column.sql    → adds title
 *   4-create-files-table.sql  → files table
 *   5-add-new-columns.sql     → adds pullups + all skill columns + maxGreen
 *   6-add-breath-hold.sql     → adds breathHold column
 *   7-convert-to-counters.sql → converts booleans to numeric counters + pips
 *   8-create-targets-table.sql→ adds habit_targets table (see bottom of this file's notes)
 *   9-wake-at-5.sql            → drops maxGreen, adds wokeAt5 column
 *
 * Field model (post-migration 7):
 *   Counters (uncapped, no minimum below 0):
 *     pushupsCount, readPagesCount, pullupsCount, oneHandPushupsCount,
 *     breathHoldSeconds
 *   Pips (capped 0-3):
 *     stretchPips, lSitPips, productivePips, cardTrickPips
 *   Plain fields:
 *     title, nDay, nRead, wokeAt5
 *
 * Targets (post-migration 8), table habit_targets:
 *   id INTEGER PK, field TEXT, value INTEGER, effectiveFrom TEXT (YYYY-MM-DD)
 *   One row per "change" — the value in effect for a given date is the
 *   most recent row with effectiveFrom <= that date (see index.html
 *   getTargetForDate). UNIQUE(field, effectiveFrom) so re-saving the
 *   same field+date overwrites instead of duplicating.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PIP_MAX = 3;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function clampCounter(n) {
  n = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(0, n);
}

function clampPip(n) {
  n = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(0, Math.min(PIP_MAX, n));
}

/* ── targets sub-handlers ── */

async function getTargets(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, field, value, effectiveFrom FROM habit_targets ORDER BY effectiveFrom ASC'
  ).all();
  return json(results);
}

async function postTarget(request, env) {
  const t = await request.json();
  if (!t.field || typeof t.value === 'undefined' || !t.effectiveFrom) {
    return json({ error: 'Missing field, value, or effectiveFrom' }, 400);
  }
  const value = clampCounter(t.value);

  await env.DB.prepare(`
    INSERT INTO habit_targets (field, value, effectiveFrom)
    VALUES (?, ?, ?)
    ON CONFLICT(field, effectiveFrom) DO UPDATE SET
      value = excluded.value
  `).bind(t.field, value, t.effectiveFrom).run();

  return json({ ok: true });
}

async function deleteTarget(url, env) {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM habit_targets WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

/* ── GET: habits, or targets if ?resource=targets ── */
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('resource') === 'targets') {
      return await getTargets(env);
    }

    const { results } = await env.DB.prepare('SELECT * FROM habits').all();
    const out = {};
    for (const row of results) {
      out[row.date] = {
        date:  row.date,
        title: row.title ?? '',

        pushupsCount:        clampCounter(row.pushupsCount),
        readPagesCount:      clampCounter(row.readPagesCount),
        pullupsCount:        clampCounter(row.pullupsCount),
        oneHandPushupsCount: clampCounter(row.oneHandPushupsCount),
        breathHoldSeconds:   clampCounter(row.breathHoldSeconds),

        stretchPips:    clampPip(row.stretchPips),
        lSitPips:       clampPip(row.lSitPips),
        productivePips: clampPip(row.productivePips),
        cardTrickPips:  clampPip(row.cardTrickPips),

        wokeAt5:  !!row.wokeAt5,
        nDay:     row.nDay  ?? '',
        nRead:    row.nRead ?? '',
      };
    }
    return json(out);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ── POST: upsert a habit entry, or a target if ?resource=targets ── */
export async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('resource') === 'targets') {
      return await postTarget(request, env);
    }

    const t = await request.json();
    if (!t.date) return json({ error: 'Missing date' }, 400);

    const pushupsCount        = clampCounter(t.pushupsCount);
    const readPagesCount      = clampCounter(t.readPagesCount);
    const pullupsCount        = clampCounter(t.pullupsCount);
    const oneHandPushupsCount = clampCounter(t.oneHandPushupsCount);
    const breathHoldSeconds   = clampCounter(t.breathHoldSeconds);

    const stretchPips    = clampPip(t.stretchPips);
    const lSitPips       = clampPip(t.lSitPips);
    const productivePips = clampPip(t.productivePips);
    const cardTrickPips  = clampPip(t.cardTrickPips);

    await env.DB.prepare(`
      INSERT INTO habits (
        date, title,
        pushupsCount, readPagesCount, pullupsCount, oneHandPushupsCount, breathHoldSeconds,
        stretchPips, lSitPips, productivePips, cardTrickPips,
        wokeAt5,
        nDay, nRead
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        title               = excluded.title,
        pushupsCount        = excluded.pushupsCount,
        readPagesCount      = excluded.readPagesCount,
        pullupsCount        = excluded.pullupsCount,
        oneHandPushupsCount = excluded.oneHandPushupsCount,
        breathHoldSeconds   = excluded.breathHoldSeconds,
        stretchPips         = excluded.stretchPips,
        lSitPips            = excluded.lSitPips,
        productivePips      = excluded.productivePips,
        cardTrickPips       = excluded.cardTrickPips,
        wokeAt5             = excluded.wokeAt5,
        nDay                = excluded.nDay,
        nRead               = excluded.nRead
    `).bind(
      t.date,
      t.title ?? '',
      pushupsCount,
      readPagesCount,
      pullupsCount,
      oneHandPushupsCount,
      breathHoldSeconds,
      stretchPips,
      lSitPips,
      productivePips,
      cardTrickPips,
      t.wokeAt5 ? 1 : 0,
      t.nDay  ?? '',
      t.nRead ?? '',
    ).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ── DELETE: only used for ?resource=targets&id=... ── */
export async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('resource') === 'targets') {
      return await deleteTarget(url, env);
    }
    return json({ error: 'Not supported' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
