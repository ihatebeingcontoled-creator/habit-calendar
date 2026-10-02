// functions/api/spend.js  ->  https://bens-calendar.pages.dev/api/spend
// Apple Pay (iOS Shortcuts) -> money_entries, with structured fields:
//   POST { amount, merchant }          saves the payment (store = merchant)
//   PUT  { id, street, item }          adds the street + what you bought afterwards
//        (old shortcuts that send { id, note } still work: the text is stored as "item")
//
// Needs in Cloudflare Pages -> Settings -> Variables and Secrets:
//   SPEND_TOKEN  (secret) — same value as after "Bearer " in the Shortcut
// Uses the same D1 binding as money.js: DB

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const authed = (request, env) =>
  Boolean(env.SPEND_TOKEN) && (request.headers.get('Authorization') || '') === `Bearer ${env.SPEND_TOKEN}`;

// "€5.40", "5,40 €", "-12.00", "1,234.50" -> number
function parseAmount(raw) {
  let s = String(raw ?? '').replace(/[^\d.,-]/g, '');
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Math.abs(parseFloat(s));
  return Number.isFinite(n) ? n : NaN;
}

let schemaReady = null;
function ensureSchema(db) {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.prepare(`CREATE TABLE IF NOT EXISTS money_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
    const { results } = await db.prepare('PRAGMA table_info(money_entries)').all();
    const have = new Set(results.map((r) => r.name));
    for (const c of ['store', 'street', 'item']) {
      if (!have.has(c)) await db.prepare(`ALTER TABLE money_entries ADD COLUMN ${c} TEXT DEFAULT ''`).run();
    }
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_money_date ON money_entries(date)').run();
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

export async function onRequestPost({ request, env }) {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401);
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }

  const amount = parseAmount(body.amount);
  if (!(amount > 0)) return json({ error: 'bad amount', got: body.amount }, 400);

  const store = String(body.merchant ?? '').trim().slice(0, 120);
  const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vilnius' }); // YYYY-MM-DD

  await ensureSchema(db);
  const res = await db
    .prepare('INSERT INTO money_entries (date, amount, note, source, store) VALUES (?, ?, ?, ?, ?)')
    .bind(date, -amount, store || 'Apple Pay', 'apple pay', store)
    .run();

  return json({ ok: true, id: res.meta?.last_row_id, date, amount: -amount, store });
}

export async function onRequestPut({ request, env }) {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401);
  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'body must be JSON' }, 400); }

  const id = Number(body.id);
  let street = String(body.street ?? '').trim().slice(0, 150);
  let item = String(body.item ?? '').trim().slice(0, 200);
  if (!street && !item && body.note) item = String(body.note).trim().slice(0, 200); // old shortcut format
  if (!id || (!street && !item)) return json({ error: 'id and street/item required' }, 400);

  await ensureSchema(db);
  const res = await db
    .prepare("UPDATE money_entries SET street = ?, item = ? WHERE id = ? AND source = 'apple pay'")
    .bind(street, item, id)
    .run();

  if (!res.meta?.changes) return json({ error: 'entry not found' }, 404);
  return json({ ok: true, id });
}
