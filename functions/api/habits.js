/**
 * GET  /api/habits  → returns all habit entries as JSON (public, no auth)
 * POST /api/habits  → upserts an entry (open — anyone can edit, no auth)
 *
 * D1 binding name: DB
 *
 * D1 schema — run migrations in order via the D1 Console:
 *   1-create-table.sql      → base table
 *   2-seed-data.sql         → seed rows
 *   3-add-title-column.sql  → adds title
 *   4-create-files-table.sql→ files table
 *   5-add-new-columns.sql   → adds pullups + all skill columns + maxGreen
 *   6-add-breath-hold.sql   → adds breathHold column
 *   7-convert-to-counters.sql → converts booleans to numeric counters + pips
 *
 * Field model (post-migration 7):
 *   Counters (uncapped, no minimum below 0):
 *     pushupsCount, readPagesCount, pullupsCount, oneHandPushupsCount,
 *     breathHoldSeconds
 *   Pips (capped 0-3):
 *     stretchPips, lSitPips, productivePips, cardTrickPips
 *   Plain fields:
 *     title, nDay, nRead, maxGreen
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

/* ── GET: return all entries as { 'YYYY-MM-DD': {...}, ... } ── */
export async function onRequestGet({ env }) {
  try {
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

        maxGreen: !!row.maxGreen,
        nDay:     row.nDay  ?? '',
        nRead:    row.nRead ?? '',
      };
    }
    return json(out);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ── POST: upsert an entry (open — no auth) ── */
export async function onRequestPost({ request, env }) {
  try {
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
        maxGreen,
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
        maxGreen            = excluded.maxGreen,
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
      t.maxGreen ? 1 : 0,
      t.nDay  ?? '',
      t.nRead ?? '',
    ).run();
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
