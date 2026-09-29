// Cloudflare Pages Function: /api/money-scan
// Needs a secret named GROQ_API_KEY. Optional var GROQ_MODEL (default below).
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  if (!env.GROQ_API_KEY) return json({ error: 'GROQ_API_KEY not set' }, 500);
  const { image, today } = await request.json();
  if (!image || !image.startsWith('data:image/')) return json({ error: 'image required' }, 400);

  const prompt = `Extract every money transaction visible in this screenshot (bank/app/receipt/calendar).
Today's date is ${today}. If a date has no year, assume the year that makes it the most recent past date.
Return ONLY JSON: {"entries":[{"date":"YYYY-MM-DD","amount":number,"note":"short label"}]}
Rules: money spent/leaving = NEGATIVE amount, money received = POSITIVE. Amounts in euros as plain numbers (12.50, not "€12,50"). Skip totals and balances. If nothing is found return {"entries":[]}.`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.GROQ_API_KEY },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'qwen/qwen3.6-27b',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: image } }
      ] }]
    })
  });
  if (!r.ok) return json({ error: 'Groq error ' + r.status, detail: (await r.text()).slice(0, 300) }, 502);

  const data = await r.json();
  let text = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '');
  const m = text.match(/\{[\s\S]*\}/);
  let entries = [];
  try { entries = JSON.parse(m ? m[0] : '{}').entries || []; } catch (e) {}
  entries = entries
    .filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(Number(e.amount)))
    .map(e => ({ date: e.date, amount: Number(e.amount), note: String(e.note || '').slice(0, 200) }));
  return json({ entries });
}
