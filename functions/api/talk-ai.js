/**
 * POST /api/talk-ai
 * Body: { transcript: string, nowISO: string }
 * Returns: { items: [ EventItem | HabitItem, ... ] }
 *
 *   EventItem: { kind:"event", dateKey, title, description, color, startMinutes, durationMinutes }
 *   HabitItem: { kind:"habit", dateKey, field, op:"delta"|"set", value }
 *     - counter/pip fields (pushupsCount, readPagesCount, pullupsCount,
 *       oneHandPushupsCount, breathHoldSeconds, stretchPips, lSitPips,
 *       productivePips, cardTrickPips) use op:"delta" with a numeric value
 *       (e.g. "did 50 pushups" -> {field:"pushupsCount", op:"delta", value:50})
 *     - wokeAt5 uses op:"set" with a boolean value
 *     - free-text fields (nDay, nRead, nExtra, title) use op:"set" with a string
 *
 * Takes a raw speech transcript that may describe several things
 * across several days — timed/plannable activities ("dinner at 7",
 * "meeting tomorrow at 3") become events; tally/checkbox things tied
 * to the day itself ("did 50 pushups", "read today", "woke up at 5")
 * become habit updates. Every item is validated/clamped here before
 * it's ever handed back to the client — bad or missing fields never
 * reach either /api/events or /api/habits.
 *
 * Requires:
 *   GROQ_API_KEY — set in Pages → Settings → Variables and Secrets.
 *
 * This is read-only with respect to D1 — it never touches the DB
 * itself. Habit deltas are returned as deltas, not absolute values;
 * the client merges them against its own in-memory habitsData (it
 * already has the current values loaded) before POSTing to
 * /api/habits. Neither /api/events nor /api/habits are modified.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Must match EventEditor's COLOR_SWATCHES in index.html — anything
// outside this list gets coerced to the first (blue) default.
const VALID_COLORS = [
  '#3b82f6', '#e6362a', '#f59e0b', '#10b981', '#14b8a6',
  '#8b5cf6', '#ec4899', '#64748b', '#78350f', '#111827',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Mirrors the field model documented at the top of functions/api/habits.js
// and the FIELD_CONFIG list in index.html.
const COUNTER_FIELDS = ['pushupsCount', 'readPagesCount', 'pullupsCount', 'oneHandPushupsCount', 'breathHoldSeconds'];
const PIP_FIELDS = ['stretchPips', 'lSitPips', 'productivePips', 'cardTrickPips'];
const BOOL_FIELDS = ['wokeAt5'];
const TEXT_FIELDS = ['nDay', 'nRead', 'nExtra', 'title'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function clampMinutes(n, fallback) {
  n = Number(n);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1439, Math.trunc(n)));
}

function clampDuration(n, fallback) {
  n = Number(n);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.max(5, Math.min(1440, Math.trunc(n)));
}

function buildPrompt(transcript, nowISO) {
  return [
    {
      role: 'system',
      content:
        'You convert a spoken diary/planning transcript into structured updates for a habit-tracking ' +
        'calendar app. The current date/time (ISO, already in the user\'s local zone) is: ' + nowISO + '. ' +
        'The transcript may mix two different kinds of things, across multiple days (yesterday, today, ' +
        'tomorrow, "at 15", "before bed"):\n\n' +
        '1. EVENTS — timed/plannable things ("dinner at 7", "meeting tomorrow at 3", "went to the gym at noon"). ' +
        'Emit: {"kind":"event","dateKey":"YYYY-MM-DD","title":short string,"description":short first-person ' +
        'string,"color":one of [' + VALID_COLORS.join(', ') + '] (pick ' + VALID_COLORS[1] +
        ' for wasted/guilty/unproductive, ' + VALID_COLORS[3] + ' or ' + VALID_COLORS[4] +
        ' for productive/positive, ' + VALID_COLORS[0] + ' as neutral default),' +
        '"startMinutes":integer 0-1439 (minutes since midnight),"durationMinutes":integer (best reasonable guess if unstated)}.\n\n' +
        '2. HABIT/CHECKLIST UPDATES — tally or checkbox things tied to the day itself, not a specific clock ' +
        'time ("did 50 pushups", "read today", "woke up at 5", "stretched"). Emit: {"kind":"habit",' +
        '"dateKey":"YYYY-MM-DD","field":one of [' + COUNTER_FIELDS.concat(PIP_FIELDS).concat(BOOL_FIELDS).concat(TEXT_FIELDS).join(', ') +
        '],"op":"delta" for the counter/pip fields (' + COUNTER_FIELDS.concat(PIP_FIELDS).join(', ') +
        ') with a numeric "value" (e.g. did 50 pushups -> value:50), or "op":"set" for wokeAt5 with a boolean ' +
        '"value", or "op":"set" for the free-text fields (' + TEXT_FIELDS.join(', ') + ') with a short string "value"}.\n\n' +
        'Resolve every relative date/time against the current date/time given above. Respond with ONLY a raw ' +
        'JSON array (no markdown, no prose, no code fences) mixing both kinds as needed. If duration or exact ' +
        'time for an event isn\'t stated, make a sensible guess rather than omitting it. Never invent things ' +
        'that weren\'t mentioned. If nothing describable is found, return [].',
    },
    { role: 'user', content: transcript },
  ];
}

function parseModelOutput(text) {
  let cleaned = String(text || '').trim();
  // Strip accidental code fences even though the prompt asks against them.
  cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    throw new Error('not an array');
  } catch {
    // Groq occasionally prefaces the array with a sentence or two
    // despite instructions not to. Fall back to extracting the first
    // balanced [...] span rather than failing the whole request.
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Model did not return a JSON array');
    }
    const sliced = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(sliced);
    if (!Array.isArray(parsed)) throw new Error('Model did not return a JSON array');
    return parsed;
  }
}

function validateEvent(raw, fallbackDateKey) {
  const dateKey = DATE_RE.test(raw.dateKey) ? raw.dateKey : fallbackDateKey;
  const title = (typeof raw.title === 'string' && raw.title.trim()) ? raw.title.trim().slice(0, 60) : 'Event';
  const description = (typeof raw.description === 'string') ? raw.description.trim().slice(0, 300) : '';
  const color = VALID_COLORS.includes(raw.color) ? raw.color : VALID_COLORS[0];
  const startMinutes = clampMinutes(raw.startMinutes, 0);
  const durationMinutes = clampDuration(raw.durationMinutes, 30);

  return { kind: 'event', dateKey, title, description, color, startMinutes, durationMinutes };
}

function validateHabit(raw, fallbackDateKey) {
  const dateKey = DATE_RE.test(raw.dateKey) ? raw.dateKey : fallbackDateKey;
  const field = raw.field;

  if (COUNTER_FIELDS.includes(field) || PIP_FIELDS.includes(field)) {
    const value = Number(raw.value);
    if (!Number.isFinite(value) || value === 0) return null;
    // Pips are capped 0-3 total, so an absurd spoken delta (e.g. "50 pips")
    // is still clamped client-side against the real current value — here
    // we just cap the delta itself to a sane range per field type.
    const cap = PIP_FIELDS.includes(field) ? 3 : 1000;
    const clamped = Math.max(-cap, Math.min(cap, Math.trunc(value)));
    return { kind: 'habit', dateKey, field, op: 'delta', value: clamped };
  }

  if (BOOL_FIELDS.includes(field)) {
    return { kind: 'habit', dateKey, field, op: 'set', value: !!raw.value };
  }

  if (TEXT_FIELDS.includes(field)) {
    const value = (typeof raw.value === 'string') ? raw.value.trim().slice(0, 300) : '';
    if (!value) return null;
    return { kind: 'habit', dateKey, field, op: 'set', value };
  }

  return null;
}

function validateItem(raw, fallbackDateKey) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.kind === 'event') return validateEvent(raw, fallbackDateKey);
  if (raw.kind === 'habit') return validateHabit(raw, fallbackDateKey);
  return null;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GROQ_API_KEY) {
      return json({ error: 'Missing GROQ_API_KEY on this Pages project.' }, 500);
    }

    const { transcript, nowISO } = await request.json();
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return json({ error: 'Missing transcript' }, 400);
    }
    const now = nowISO && !isNaN(Date.parse(nowISO)) ? nowISO : new Date().toISOString();
    const fallbackDateKey = now.slice(0, 10);

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: buildPrompt(transcript, now),
        temperature: 0.2,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      return json({ error: 'Groq request failed: ' + groqRes.status + ' ' + errText.slice(0, 200) }, 502);
    }

    const groqData = await groqRes.json();
    const text = groqData?.choices?.[0]?.message?.content || '[]';

    let rawEvents;
    try {
      rawEvents = parseModelOutput(text);
    } catch {
      return json({ error: 'Could not parse model output', items: [] }, 200);
    }

    const items = rawEvents
      .map((e) => validateItem(e, fallbackDateKey))
      .filter(Boolean);

    return json({ items });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
