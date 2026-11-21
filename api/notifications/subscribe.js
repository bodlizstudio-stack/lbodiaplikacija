// Vercel Serverless Function: Web Push Subscription Validation & Readiness Status (CommonJS)
module.exports = async function handler(req, res) {
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

  let bodyObj = {};
  try {
    bodyObj =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body && typeof req.body === 'object'
        ? req.body
        : {};
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON body.' });
    return;
  }

  const subscription = bodyObj.subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
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
    endpointHashHint: String(subscription.endpoint).slice(-12),
    recordedAt: new Date().toISOString(),
  });
};
