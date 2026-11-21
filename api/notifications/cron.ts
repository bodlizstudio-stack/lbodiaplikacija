// Vercel Serverless Function: Idempotent Scheduled Reminder Dispatch Endpoint
declare const process: { env: Record<string, string | undefined> };

interface VercelRequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (token !== `Bearer ${cronSecret}`) {
      res.status(401).json({ ok: false, error: 'Unauthorized scheduler request.' });
      return;
    }
  }

  const hasVapid = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  const hasPushStore = Boolean(process.env.KV_REST_API_URL || process.env.DATABASE_URL);

  res.status(200).json({
    ok: true,
    schedulerReady: hasVapid && hasPushStore,
    hasVapidKeys: hasVapid,
    hasCloudSubscriptionStore: hasPushStore,
    checkedAtUtc: new Date().toISOString(),
    message:
      hasVapid && hasPushStore
        ? 'Background push scheduler verified and ready.'
        : 'In-app & local native OS notifications active. Background Web Push while browser is closed requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and a cloud KV/Postgres subscription store.',
  });
}
