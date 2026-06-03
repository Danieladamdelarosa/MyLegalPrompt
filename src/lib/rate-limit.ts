/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments and as a sane default. For
 * multi-instance/serverless production, swap the store for Redis/Upstash by
 * implementing the same `check` contract — call sites don't change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Periodically evict expired buckets to bound memory.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of store) {
    if (b.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    success: bucket.count <= limit,
    limit,
    remaining,
    resetAt: bucket.resetAt,
  };
}

/** Best-effort client IP from common proxy headers. */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
