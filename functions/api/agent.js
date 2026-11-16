// functions/api/agent.js  ->  /api/agent      (the Test tab "Automate" dashboard: the AI agent step)
//
//   POST ?resource=test   body: { model? }                  -> { ok, model, found }   checks the Groq key + model, spends no tokens
//   POST ?resource=run    body: { prompt, text, model?, maxChars? }
//                                                           -> { text, model, usedChars, truncated }
//
// "prompt" is your Agent code (what the agent must do). "text" is the cleaned scan.
// Needs the Cloudflare variable GROQ_API_KEY (the same one talk-ai.js already uses).

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const BASE = 'https://api.groq.com/openai/v1';
const MAX_CHARS = 16000;           // keeps one request inside the free Groq per-minute token limit
const okModel = (m) => (typeof m === 'string' && /^[\w\-./:]{3,80}$/.test(m) ? m : DEFAULT_MODEL);

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GROQ_API_KEY) return json({ ok: false, error: 'Missing GROQ_API_KEY on this Pages project (Settings → Variables and Secrets).' }, 500);
    const res = new URL(request.url).searchParams.get('resource');
    const b = await request.json().catch(() => ({}));
    const model = okModel(b.model);
    const headers = { Authorization: 'Bearer ' + env.GROQ_API_KEY };

    if (res === 'test') {
      const r = await fetch(BASE + '/models', { headers });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return json({ ok: false, error: r.status === 401 ? 'Groq rejected the key (401). Check GROQ_API_KEY.' : 'Groq answered ' + r.status + ' ' + t.slice(0, 160) }, 200);
      }
      const d = await r.json().catch(() => ({}));
      const ids = (d.data || []).map((m) => m.id);
      return json({ ok: true, model, found: ids.includes(model), models: ids.length });
    }

    if (res === 'run') {
      const prompt = String(b.prompt || '').trim();
      let text = String(b.text || '');
      if (!prompt) return json({ error: 'The Agent code box is empty. Write what the agent should do.' }, 400);
      if (!text.trim()) return json({ error: 'There is no scanned text to send.' }, 400);
      const cap = Math.min(60000, Math.max(2000, parseInt(b.maxChars, 10) || MAX_CHARS));
      const truncated = text.length > cap;
      if (truncated) text = text.slice(0, cap);
      const today = new Date().toISOString().slice(0, 10);
      const r = await fetch(BASE + '/chat/completions', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: prompt + '\n\nToday is ' + today + '.' },
            { role: 'user', content: text },
          ],
        }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return json({ error: (r.status === 429 ? 'Groq says too many requests / tokens right now (429). Try again in a minute. ' : r.status === 413 ? 'The text is too big for Groq (413). Delete more words first. ' : 'Groq request failed: ' + r.status + '. ') + t.slice(0, 200) }, 502);
      }
      const d = await r.json();
      const out = (d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
      return json({ text: out, model, usedChars: text.length, truncated });
    }
    return json({ error: 'Unknown resource' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
