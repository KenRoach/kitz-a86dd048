// Simple in-memory rate limiter for Deno Edge Functions.
//
// NOTE: This is best-effort per instance (not globally consistent across regions/instances),
// but it significantly reduces abuse for public endpoints and expensive AI calls.

type Bucket = {
  windowStart: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

function cleanup(now: number, windowMs: number) {
  // Avoid unbounded growth; prune old entries.
  if (buckets.size < 5000) return;
  const cutoff = now - windowMs * 3;
  for (const [k, v] of buckets.entries()) {
    if (v.windowStart < cutoff) buckets.delete(k);
  }
}

export function getClientIp(req: Request): string {
  // Prefer common proxy headers.
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * Returns true if the key is rate-limited.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - (now % windowMs);

  const entry = buckets.get(key);
  if (!entry || entry.windowStart !== windowStart) {
    buckets.set(key, { windowStart, count: 1 });
    cleanup(now, windowMs);
    return false;
  }

  if (entry.count >= limit) return true;
  entry.count += 1;
  buckets.set(key, entry);
  return false;
}
