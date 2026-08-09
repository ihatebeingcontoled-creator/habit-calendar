/**
 * POST /api/talk-ai
 * Body: { transcript: string, nowISO: string, existingEvents?: { [dateKey]: EventContext[] } }
 * Returns: { items: [ EventItem | EventEditItem | HabitItem, ... ] }
 *
 *   EventItem: { kind:"event", dateKey, title, description, color, startMinutes, durationMinutes }
 *   EventEditItem: { kind:"event_edit", id, dateKey, [title], [description], [color],
 *                     [locked], [notify], [startMinutes], [durationMinutes] }
 *     - `id` must be one of the ids the client sent in `existingEvents` — the model can
 *       never invent one, and `dateKey` is taken from wherever the client's own data says
 *       that id actually lives (the model's guess at dateKey is ignored for this kind).
 *     - Every other field is OPTIONAL — only the ones the transcript actually asked to
 *       change should be present; anything omitted is left as-is on the client.
 *   EventDeleteItem: { kind:"event_delete", id, dateKey }
 *     - Same `id`/`dateKey` resolution rule as EventEditItem: id must be one the client
 *       already sent, dateKey is resolved server-side from that id, never from the model.
 *   HabitItem: { kind:"habit", dateKey, field, op:"delta"|"set", value }
 *     - counter/pip fields (pushupsCount, readPagesCount, pullupsCount,
 *       oneHandPushupsCount, breathHoldSeconds, stretchPips, lSitPips,
 *       productivePips, cardTrickPips) use op:"delta" with a numeric value
 *       (e.g. "did 50 pushups" -> {field:"pushupsCount", op:"delta", value:50})
 *     - wokeAt5 uses op:"set" with a boolean value
 *     - free-text fields (nDay, nRead, nExtra, title) use op:"set" with a string
 *
 * Takes a raw speech transcript that may describe several things across
 * several days — timed/plannable activities ("dinner at 7", "meeting
 * tomorrow at 3") become new events; tally/checkbox things tied to the
 * day itself ("did 50 pushups", "read today", "woke up at 5") become
 * habit updates; and references to something ALREADY on the calendar
 * ("mark today's gym session green", "lock that meeting", "turn on the
 * alert for dinner") become event_edit items instead of duplicating a
 * new box. Every item is validated/clamped here before it's ever handed
 * back to the client — bad or missing fields, or an edit pointing at an
 * id the client never actually sent, never reach either /api/events or
 * /api/habits.
 *
 * Requires:
 *   GROQ_API_KEY — set in Pages → Settings → Variables and Secrets.
 *
 * This is read-only with respect to D1 — it never touches the DB
 * itself. Habit deltas are returned as deltas, not absolute values;
 * the client merges them against its own in-memory habitsData (it
 * already has the current values loaded) before POSTing to
 * /api/habits. `existingEvents` is likewise just context the client
 * already had loaded (from EventStore) — this function never reads or
 * writes anything itself. Neither /api/events nor /api/habits are
 * modified here.
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

// How many existing-event entries we'll ever fold into the prompt.
// The client should already be sending a reasonably-scoped window
// (see gatherExistingEventsContext in index.html), this is just a
// hard backstop against a runaway prompt if it ever isn't.
const MAX_EXISTING_EVENTS = 250;

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

// Turns the client-supplied existingEvents map into (a) a compact,
// token-cheap text block for the prompt and (b) an id -> dateKey
// lookup so validateEventEdit can authoritatively resolve dateKey
// itself rather than trusting whatever the model echoes back.
function summarizeExistingEvents(existingEvents) {
  const idToDateKey = new Map();
  const lines = [];
  if (!existingEvents || typeof existingEvents !== 'object') {
    return { lines, idToDateKey };
  }

  let count = 0;
  for (const dateKey of Object.keys(existingEvents).sort()) {
    if (!DATE_RE.test(dateKey)) continue;
    const list = Array.isArray(existingEvents[dateKey]) ? existingEvents[dateKey] : [];
    for (const ev of list) {
      if (count >= MAX_EXISTING_EVENTS) break;
      const id = typeof ev?.id === 'string' ? ev.id : null;
      if (!id) continue;
      idToDateKey.set(id, dateKey);
      const title = (typeof ev.title === 'string' && ev.title.trim()) ? ev.title.trim().slice(0, 60) : '(untitled)';
      const start = Number.isFinite(ev.startMinutes) ? ev.startMinutes : 0;
      const dur = Number.isFinite(ev.durationMinutes) ? ev.durationMinutes : 0;
      const hh = String(Math.floor(start / 60)).padStart(2, '0');
      const mm = String(start % 60).padStart(2, '0');
      const flags = [ev.locked ? 'locked' : null, ev.notify ? 'alert-on' : null].filter(Boolean).join(',');
      lines.push(
        `id=${id} date=${dateKey} time=${hh}:${mm}+${dur}m color=${ev.color || VALID_COLORS[0]}` +
        (flags ? ` [${flags}]` : '') + ` title="${title}"`
      );
      count++;
    }
    if (count >= MAX_EXISTING_EVENTS) break;
  }
  return { lines, idToDateKey };
}

function buildPrompt(transcript, nowISO, existingEventLines) {
  const existingBlock = existingEventLines.length
    ? '\n\nEXISTING EVENTS ALREADY ON THE CALENDAR (for matching edits ONLY — never invent an ' +
      'id that isn\'t listed here, and never repeat one of these back as a brand-new "event" ' +
      'item, that would create a duplicate box):\n' + existingEventLines.join('\n')
    : '\n\n(No existing events were provided as context, so nothing can be edited this turn — ' +
      'treat every timed/plannable thing as a new event.)';

  return [
    {
      role: 'system',
      content:
        'You convert a spoken diary/planning transcript into structured updates for a habit-tracking ' +
        'calendar app. The current date/time (ISO, already in the user\'s local zone) is: ' + nowISO + '. ' +
        'The transcript may mix several different kinds of things, across multiple days (yesterday, today, ' +
        'tomorrow, "at 15", "before bed"):\n\n' +
        '1. NEW EVENTS — timed/plannable things that are not already on the calendar ("dinner at 7", ' +
        '"meeting tomorrow at 3", "went to the gym at noon"). Emit: {"kind":"event","dateKey":"YYYY-MM-DD",' +
        '"title":short string,"description":short first-person string,"color":one of [' + VALID_COLORS.join(', ') +
        '] (pick ' + VALID_COLORS[1] + ' for wasted/guilty/unproductive, ' + VALID_COLORS[3] + ' or ' + VALID_COLORS[4] +
        ' for productive/positive/completed, ' + VALID_COLORS[0] + ' as neutral default),' +
        '"startMinutes":integer 0-1439 (minutes since midnight),"durationMinutes":integer (best reasonable guess if unstated)}.\n\n' +
        '2. EDITS TO AN EXISTING EVENT — the transcript refers to something already on the calendar (see the ' +
        'list below) rather than describing something brand new. Common triggers: "I just finished X" / "I just ' +
        'did X" (usually means: mark it done, e.g. turn it ' + VALID_COLORS[3] + ' or ' + VALID_COLORS[4] +
        ' green), "mark X as done/complete", "lock that", "turn on/off the alert for X", "rename X to Y", ' +
        '"move X to 15", "make X an hour instead". Emit: {"kind":"event_edit","id":"<id copied EXACTLY from the ' +
        'list below>","dateKey":"YYYY-MM-DD" (copy the date next to that id), plus ONLY the fields that are ' +
        'actually changing, any subset of: "title":string, "description":string, "color":one of [' +
        VALID_COLORS.join(', ') + '], "locked":boolean, "notify":boolean, "startMinutes":integer 0-1439, ' +
        '"durationMinutes":integer}. Do not include a field you\'re not changing. If you cannot confidently ' +
        'match the reference to one specific id from the list, do NOT guess — either skip it entirely or, if ' +
        'it more plausibly describes something new, emit it as a new "event" instead.\n\n' +
        '3. HABIT/CHECKLIST UPDATES — tally or checkbox things tied to the day itself, not a specific clock ' +
        'time ("did 50 pushups", "read today", "woke up at 5", "stretched"). Emit: {"kind":"habit",' +
        '"dateKey":"YYYY-MM-DD","field":one of [' + COUNTER_FIELDS.concat(PIP_FIELDS).concat(BOOL_FIELDS).concat(TEXT_FIELDS).join(', ') +
        '],"op":"delta" for the counter/pip fields (' + COUNTER_FIELDS.concat(PIP_FIELDS).join(', ') +
        ') with a numeric "value" (e.g. did 50 pushups -> value:50), or "op":"set" for wokeAt5 with a boolean ' +
        '"value", or "op":"set" for the free-text fields (' + TEXT_FIELDS.join(', ') + ') with a short string "value"}.\n\n' +
        '4. DELETE AN EXISTING EVENT — the transcript asks to remove/cancel/get rid of something already on ' +
        'the calendar (see the list below) rather than change one of its fields. Common triggers: "delete X", ' +
        '"cancel X", "remove X", "get rid of the Y meeting", "never mind about X, take it off". Emit: ' +
        '{"kind":"event_delete","id":"<id copied EXACTLY from the list below>","dateKey":"YYYY-MM-DD" (copy ' +
        'the date next to that id)}. If you cannot confidently match the reference to one specific id from the ' +
        'list, do NOT guess — skip it entirely rather than deleting the wrong thing.' +
        existingBlock + '\n\n' +
        'Resolve every relative date/time against the current date/time given above. Respond with ONLY a raw ' +
        'JSON array (no markdown, no prose, no code fences) mixing any of the four kinds as needed. If duration ' +
        'or exact time for a new event isn\'t stated, make a sensible guess rather than omitting it. Never invent ' +
        'things that weren\'t mentioned, and never invent an id. If nothing describable is found, return [].',
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

// Unlike validateEvent, every field except id/dateKey is OPTIONAL —
// only fields actually present (and valid) end up on the returned
// item, so the client knows to leave everything else untouched.
// `dateKey` is never taken from the model; it's resolved from
// idToDateKey (built server-side from what the client actually sent)
// so a hallucinated or mismatched dateKey can't misroute the edit.
function validateEventEdit(raw, idToDateKey) {
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id || !idToDateKey.has(id)) return null; // must reference a real, client-provided event
  const dateKey = idToDateKey.get(id);

  const out = { kind: 'event_edit', id, dateKey };
  let changed = false;

  if (typeof raw.title === 'string' && raw.title.trim()) {
    out.title = raw.title.trim().slice(0, 60);
    changed = true;
  }
  if (typeof raw.description === 'string') {
    out.description = raw.description.trim().slice(0, 300);
    changed = true;
  }
  if (raw.color !== undefined && VALID_COLORS.includes(raw.color)) {
    out.color = raw.color;
    changed = true;
  }
  if (typeof raw.locked === 'boolean') {
    out.locked = raw.locked;
    changed = true;
  }
  if (typeof raw.notify === 'boolean') {
    out.notify = raw.notify;
    changed = true;
  }
  if (raw.startMinutes !== undefined) {
    const m = clampMinutes(raw.startMinutes, null);
    if (m !== null) { out.startMinutes = m; changed = true; }
  }
  if (raw.durationMinutes !== undefined) {
    const d = clampDuration(raw.durationMinutes, null);
    if (d !== null) { out.durationMinutes = d; changed = true; }
  }

  return changed ? out : null; // no-op edits (nothing recognized/valid) are dropped
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

// Same id/dateKey resolution rule as validateEventEdit: id must
// already be one the client sent (never invented by the model), and
// dateKey is resolved from idToDateKey rather than trusted from the
// model, so a hallucinated id or mismatched dateKey can't delete the
// wrong thing (or anything at all, since it'll just fail the lookup).
function validateEventDelete(raw, idToDateKey) {
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id || !idToDateKey.has(id)) return null;
  const dateKey = idToDateKey.get(id);
  return { kind: 'event_delete', id, dateKey };
}

function validateItem(raw, fallbackDateKey, idToDateKey) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.kind === 'event') return validateEvent(raw, fallbackDateKey);
  if (raw.kind === 'event_edit') return validateEventEdit(raw, idToDateKey);
  if (raw.kind === 'event_delete') return validateEventDelete(raw, idToDateKey);
  if (raw.kind === 'habit') return validateHabit(raw, fallbackDateKey);
  return null;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GROQ_API_KEY) {
      return json({ error: 'Missing GROQ_API_KEY on this Pages project.' }, 500);
    }

    const { transcript, nowISO, existingEvents } = await request.json();
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return json({ error: 'Missing transcript' }, 400);
    }
    const now = nowISO && !isNaN(Date.parse(nowISO)) ? nowISO : new Date().toISOString();
    const fallbackDateKey = now.slice(0, 10);

    const { lines: existingEventLines, idToDateKey } = summarizeExistingEvents(existingEvents);

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: buildPrompt(transcript, now, existingEventLines),
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
      .map((e) => validateItem(e, fallbackDateKey, idToDateKey))
      .filter(Boolean);

    return json({ items });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
