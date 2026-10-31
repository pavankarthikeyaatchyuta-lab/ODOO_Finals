import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { ApiError } from '../errors.js';

/**
 * Rate-limits authentication attempts using an atomic sliding-window database counter.
 *
 * @param db - Prisma client instance
 * @param scope - Rate limit category scope (e.g. 'login', 'reset')
 * @param identity - Client IP or email address
 * @param maximum - Maximum allowed attempts per 60-second window
 */
export async function consumeAuthLimit(db: PrismaClient, scope: string, identity: string, maximum: number) {
  const key = createHash('sha256').update(`${scope}:${identity}`).digest('hex');
  const [row] = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO app."RateLimitBucket" (key, "windowStart", count)
    VALUES (${key}, clock_timestamp(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN app."RateLimitBucket"."windowStart" > EXCLUDED."windowStart" - interval '60 seconds' THEN app."RateLimitBucket".count + 1 ELSE 1 END,
      "windowStart" = CASE WHEN app."RateLimitBucket"."windowStart" > EXCLUDED."windowStart" - interval '60 seconds' THEN app."RateLimitBucket"."windowStart" ELSE EXCLUDED."windowStart" END
    RETURNING count`;
  if (row && row.count > maximum) throw new ApiError(429, 'AUTH_RATE_LIMITED', 'Too many authentication attempts; retry after the current 60-second window');
}
