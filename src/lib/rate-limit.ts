/**
 * Tiny in-memory fixed-window rate limiter. Good enough for a single-academy
 * app on one (or a few) serverless instances: it blunts credential stuffing and
 * scraping. It is NOT a distributed limiter — counters live in the process and
 * reset on deploy / cold start, and each instance counts on its own. Network-
 * level DDoS protection is the hosting platform's job.
 *
 * Swap the `Map` for @upstash/ratelimit later without touching call sites.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export type RateResult = { ok: boolean; retryAfter: number };

/**
 * Records a hit against `key` and reports whether it is still within `limit`
 * per `windowMs`. `retryAfter` is seconds until the window resets (0 when ok).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // New window. Opportunistically evict the oldest entry if the map is full.
    if (!bucket && buckets.size >= MAX_KEYS) {
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Peek without recording a hit — for "check before doing the work" flows. */
export function isRateLimited(key: string, limit: number): boolean {
  const bucket = buckets.get(key);
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= limit;
}
