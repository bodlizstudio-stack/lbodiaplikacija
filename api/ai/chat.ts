// Vercel Serverless Function: Real Gemini AI invocation (API key stays strictly server-side)
declare const process: { env: Record<string, string | undefined> };

interface VercelRequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

interface IncomingMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(ip);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

function buildSystemPrompt(
  language: 'sl' | 'en',
  authorizedContext: Record<string, unknown> | undefined
): string {
  const langLabel = language === 'en' ? 'English' : 'Slovenian (natural, respectful, warm, grammatically proper Slovenian)';
  const ctxString = authorizedContext ? JSON.stringify(authorizedContext, null, 2) : 'None shared.';

  return [
    `You are LBODI AI — the personal Faith, Discipline & Self-Improvement companion inside Luka's LBODI application ("Become who God created you to be").`,
    `Primary response language: ${langLabel}.`,
    '',
    'CORE SPIRITUAL & ETHICAL GUARDRAILS:',
    '1. Ground encouragement respectfully in Christian values centered around Jesus Christ: grace, humility, prayer, gratitude, forgiveness, self-control, patience, love, stewardship, and perseverance.',
    '2. NEVER claim to be God, Jesus Christ, the Holy Spirit, or someone directly receiving revelations or prophecies from God.',
    '3. NEVER invent Bible quotations. When referencing Scripture, cite only real chapter:verse references and clearly distinguish verified biblical teaching from AI reflection or advice.',
    '4. NEVER claim that worldly achievement, fitness, or perfect habit streaks earn God’s love or salvation. Salvation and love are through Jesus Christ.',
    '5. When summarizing user data (habits, workouts, nutrition, sleep, vision, goals, or optional private records), ONLY state numbers and facts actually present in AUTHORIZED USER CONTEXT below. Never invent statistics.',
    '6. Keep a calm, masculine, honest, respectful tone — supportive without manipulation, shame, or empty clichés.',
    '7. Never silently claim to edit database entries or reset counters; when proposing a vision rewrite or weekly plan, present the draft clearly so Luka can review and save it himself.',
    '',
    'AUTHORIZED USER CONTEXT (strictly filtered by user privacy toggles):',
    ctxString,
  ].join('\n');
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Only POST is supported.' });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      ok: false,
      code: 'RATE_LIMITED',
      error: 'Too many requests. Please wait a minute before sending another message.',
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    res.status(503).json({
      ok: false,
      code: 'AI_NOT_CONFIGURED',
      error:
        'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in Vercel Environment Variables to enable real LBODI AI responses.',
    });
    return;
  }

  let bodyObj: Record<string, unknown> = {};
  try {
    bodyObj =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : ((req.body as Record<string, unknown>) || {});
  } catch {
    res.status(400).json({ ok: false, code: 'INVALID_JSON', error: 'Invalid JSON request body.' });
    return;
  }

  const rawMessages = Array.isArray(bodyObj.messages)
    ? (bodyObj.messages as IncomingMessageItem[])
    : [];
  const messages = rawMessages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .slice(-16);

  if (messages.length === 0) {
    res.status(400).json({ ok: false, code: 'EMPTY_MESSAGES', error: 'At least one message is required.' });
    return;
  }

  const language: 'sl' | 'en' = bodyObj.language === 'en' ? 'en' : 'sl';
  const authorizedContext =
    bodyObj.authorizedContext && typeof bodyObj.authorizedContext === 'object'
      ? (bodyObj.authorizedContext as Record<string, unknown>)
      : undefined;

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content.slice(0, 6000) }],
  }));

  try {
    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(language, authorizedContext) }],
        },
        contents,
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      res.status(502).json({
        ok: false,
        code: 'AI_UPSTREAM_ERROR',
        error: `Gemini API returned HTTP ${geminiRes.status}. ${errText.slice(0, 220)}`,
      });
      return;
    }

    const data = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim() || '';

    if (!reply) {
      res.status(502).json({
        ok: false,
        code: 'AI_EMPTY_RESPONSE',
        error: 'The AI model returned an empty response. Please try again.',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      reply,
      model: modelName,
    });
  } catch (err: unknown) {
    res.status(502).json({
      ok: false,
      code: 'AI_NETWORK_ERROR',
      error: err instanceof Error ? err.message : 'Failed to connect to Gemini API.',
    });
  }
}
