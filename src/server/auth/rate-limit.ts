/**
 * A small fixed-window limiter held in memory. It protects the endpoints a
 * stranger can reach — magic-link requests and guest entry submissions — from
 * casual abuse. It resets when the container restarts, which is an acceptable
 * trade for a single-container deployment; a shared store is the upgrade path
 * if Eventr is ever run with several replicas.
 */
type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as unknown as { eventrRateLimiter?: Map<string, Bucket> };
const buckets = globalForLimiter.eventrRateLimiter ?? new Map<string, Bucket>();
globalForLimiter.eventrRateLimiter = buckets;

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

/** Keeps the map from growing without bound on a long-running container. */
export function sweepRateLimiter(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
