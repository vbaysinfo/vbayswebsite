import "server-only";

// Fixed-window in-memory rate limiter. Good for a single server instance;
// on multi-instance/serverless hosting put a shared store (e.g. Redis) or the
// host's WAF rate-limiting in front as well. Apps Script also de-duplicates.
type Bucket = { count: number; reset: number };
const g = globalThis as unknown as { __vbaysRate?: Map<string, Bucket> };
const buckets = (g.__vbaysRate ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}
