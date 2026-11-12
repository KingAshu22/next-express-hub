// lib/auth/rate-limit.js
// Small in-memory fixed-window rate limiter. It is per server instance, which
// is enough to stop bulk scraping / password guessing from a single client.
// (On multi-instance hosting, swap the Map for Redis/Upstash with the same API.)

const buckets = globalThis.__koRateLimitBuckets || new Map()
globalThis.__koRateLimitBuckets = buckets

let lastSweep = Date.now()
const sweep = (now) => {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/**
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now()
  sweep(now)
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count += 1
  const ok = bucket.count <= limit
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: ok ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  }
}

/** True when `key` already used up its limit (does not count as a hit). */
export function isRateLimited(key, limit) {
  const bucket = buckets.get(key)
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= limit
}

export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}
