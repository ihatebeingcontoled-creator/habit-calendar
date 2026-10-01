// functions/api/spend.js  ->  https://bens-calendar.pages.dev/api/spend
// Receives Apple Pay spend from the iOS Shortcuts automation and stores it in D1.
//
// Needs in Cloudflare Pages:
//   - D1 binding named DB   (Settings -> Bindings)  <- change env.DB below if yours has another name
//   - Secret named SPEND_TOKEN (Settings -> Variables and Secrets)

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const isAuthed = (request, env) => {
  const auth = request.headers.get("Authorization") || "";
  return Boolean(env.SPEND_TOKEN) && auth === `Bearer ${env.SPEND_TOKEN}`;
};

// "€5.40", "5,40 €", "-12.00", "1,234.50" -> number
function parseAmount(raw) {
  let s = String(raw ?? "").replace(/[^\d.,-]/g, "");
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", "."); // 5,40 -> 5.40
  else s = s.replace(/,/g, ""); // 1,234.50 -> 1234.50
  const n = Math.abs(parseFloat(s));
  return Number.isFinite(n) ? n : NaN;
}

async function ensureTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS apple_pay_spend (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         amount REAL NOT NULL,
         merchant TEXT,
         day TEXT NOT NULL,          -- YYYY-MM-DD, Vilnius time
         created_at TEXT NOT NULL    -- ISO timestamp (UTC)
       )`
    )
    .run();
}

export async function onRequestPost({ request, env }) {
  if (!isAuthed(request, env)) return json({ error: "unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "body must be JSON" }, 400);
  }

  const amount = parseAmount(body.amount);
  if (!(amount > 0)) return json({ error: "bad amount", got: body.amount }, 400);

  const merchant = String(body.merchant ?? "").slice(0, 120);
  const now = new Date();
  const day = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Vilnius" }); // YYYY-MM-DD

  await ensureTable(env.DB);
  const res = await env.DB
    .prepare("INSERT INTO apple_pay_spend (amount, merchant, day, created_at) VALUES (?, ?, ?, ?)")
    .bind(amount, merchant, day, now.toISOString())
    .run();

  return json({ ok: true, id: res.meta?.last_row_id, amount, merchant, day });
}

// Quick check from a terminal/browser tool: GET /api/spend?day=2026-10-01 (with the Bearer header)
export async function onRequestGet({ request, env }) {
  if (!isAuthed(request, env)) return json({ error: "unauthorized" }, 401);
  await ensureTable(env.DB);
  const day = new URL(request.url).searchParams.get("day");
  const stmt = day
    ? env.DB.prepare("SELECT * FROM apple_pay_spend WHERE day = ? ORDER BY id DESC").bind(day)
    : env.DB.prepare("SELECT * FROM apple_pay_spend ORDER BY id DESC LIMIT 50");
  const { results } = await stmt.all();
  return json({ results });
}
