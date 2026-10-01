// functions/api/spend.js  ->  https://bens-calendar.pages.dev/api/spend
// Apple Pay (iOS Shortcuts) -> saves an expense straight into money_entries,
// the same table the Money calendar reads through /api/money.
//
// Needs in Cloudflare Pages -> Settings -> Variables and Secrets:
//   SPEND_TOKEN  (secret) — same value as after "Bearer " in the Shortcut
// Uses the same D1 binding as money.js: DB

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// "€5.40", "5,40 €", "-12.00", "1,234.50" -> number
function parseAmount(raw) {
  let s = String(raw ?? "").replace(/[^\d.,-]/g, "");
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Math.abs(parseFloat(s));
  return Number.isFinite(n) ? n : NaN;
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get("Authorization") || "";
  if (!env.SPEND_TOKEN || auth !== `Bearer ${env.SPEND_TOKEN}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const db = env.DB;
  if (!db) return json({ error: 'D1 binding "DB" not found' }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "body must be JSON" }, 400); }

  const amount = parseAmount(body.amount);
  if (!(amount > 0)) return json({ error: "bad amount", got: body.amount }, 400);

  const merchant = String(body.merchant ?? "").trim();
  const extra = String(body.note ?? "").trim(); // optional: what you bought, typed in the Shortcut
  const note = ([merchant, extra].filter(Boolean).join(" — ") || "Apple Pay").slice(0, 200);
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Vilnius" }); // YYYY-MM-DD

  await db.prepare(
    `CREATE TABLE IF NOT EXISTS money_entries (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       date TEXT NOT NULL,
       amount REAL NOT NULL,
       note TEXT DEFAULT '',
       source TEXT DEFAULT 'manual',
       created_at TEXT DEFAULT CURRENT_TIMESTAMP)`
  ).run();

  await db
    .prepare("INSERT INTO money_entries (date, amount, note, source) VALUES (?, ?, ?, ?)")
    .bind(date, -amount, note, "apple pay") // expenses are negative
    .run();

  return json({ ok: true, date, amount: -amount, note });
}
