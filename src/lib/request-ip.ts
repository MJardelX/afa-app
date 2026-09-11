/**
 * Best-effort client IP for rate-limit keys, from the proxy headers Vercel
 * (and most platforms) set. Falls back to a constant so a missing header
 * buckets everyone together rather than disabling the limit.
 */

/** From a middleware `Request`. Pure — safe to import anywhere. */
export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * From a Server Component / Server Action. `next/headers` is imported lazily so
 * this module stays usable from middleware (which can't call `headers()`).
 */
export async function requestIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}
