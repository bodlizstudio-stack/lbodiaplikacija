// Vercel Serverless Function: Web Push Subscription Validation & Readiness Status
declare const process: { env: Record<string, string | undefined> };

interface VercelRequestLike {
  method?: string;
  body?: unknown;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
  const webPushConfigured = Boolean(vapidPublicKey.trim() && vapidPrivateKey.trim());

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      webPushConfigured,
      vapidPublicKey: webPushConfigured ? vapidPublicKey : null,
      note: webPushConfigured
        ? 'VAPID keys are configured for Web Push registration.'
        : 'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not yet configured on Vercel; in-app and browser-tab reminders remain active.',
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Only GET and POST are supported.' });
    return;
  }

  let bodyObj: Record<string, unknown> = {};
  try {
    bodyObj =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : ((req.body as Record<string, unknown>) || {});
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON body.' });
    return;
  }

  const subscription = bodyObj.subscription as
    | { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    | undefined;

  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    res.status(400).json({
      ok: false,
      error: 'Missing valid Web Push subscription endpoint or encryption keys.',
    });
    return;
  }

  if (!webPushConfigured) {
    res.status(503).json({
      ok: false,
      code: 'VAPID_NOT_CONFIGURED',
      webPushConfigured: false,
      error:
        'Subscription received and validated, but VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY and cloud push store are not configured yet on Vercel.',
    });
    return;
  }

  res.status(200).json({
    ok: true,
    webPushConfigured: true,
    endpointHashHint: subscription.endpoint.slice(-12),
    recordedAt: new Date().toISOString(),
  });
}
