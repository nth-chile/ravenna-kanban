import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  max?: number;
  windowMs?: number;
};

const getClientIp = (
  forwardedFor: string | undefined,
  realIp: string | undefined,
): string => {
  const firstForwarded = forwardedFor?.split(',')[0]?.trim();
  if (firstForwarded) return firstForwarded;
  if (realIp) return realIp;
  return 'unknown';
};

export const rateLimit = (options: RateLimitOptions = {}): MiddlewareHandler => {
  const max = options.max ?? 100;
  const windowMs = options.windowMs ?? 60_000;
  const buckets = new Map<string, Bucket>();

  return async (c, next) => {
    const ip = getClientIp(
      c.req.header('x-forwarded-for'),
      c.req.header('x-real-ip'),
    );
    const now = Date.now();

    // Lazy cleanup of stale buckets.
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }

    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      throw new HTTPException(429, { message: 'too many requests' });
    }

    await next();
  };
};
