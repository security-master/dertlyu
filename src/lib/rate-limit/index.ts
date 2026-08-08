import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiter {
  limit(key: string, max: number, windowMs: number): Promise<RateLimitResult>;
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

class MemoryRateLimiter implements RateLimiter {
  async limit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const current = memoryBuckets.get(key);
    if (!current || current.resetAt <= now) {
      const resetAt = now + windowMs;
      memoryBuckets.set(key, { count: 1, resetAt });
      return { success: true, remaining: max - 1, resetAt };
    }
    if (current.count >= max) {
      return { success: false, remaining: 0, resetAt: current.resetAt };
    }
    current.count += 1;
    memoryBuckets.set(key, current);
    return {
      success: true,
      remaining: Math.max(0, max - current.count),
      resetAt: current.resetAt,
    };
  }
}

class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async limit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
    const windowSeconds = Math.ceil(windowMs / 1000);
    const redisKey = `rl:${key}`;
    // Upstash REST pipeline: INCR + EXPIRE on first hit
    const incrRes = await fetch(`${this.url}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      cache: "no-store",
    });
    if (!incrRes.ok) {
      // Fail open to memory on Redis errors
      return new MemoryRateLimiter().limit(key, max, windowMs);
    }
    const incrJson = (await incrRes.json()) as { result: number };
    const count = incrJson.result;
    if (count === 1) {
      await fetch(
        `${this.url}/expire/${encodeURIComponent(redisKey)}/${windowSeconds}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
          cache: "no-store",
        },
      );
    }
    const resetAt = Date.now() + windowMs;
    if (count > max) {
      return { success: false, remaining: 0, resetAt };
    }
    return { success: true, remaining: Math.max(0, max - count), resetAt };
  }
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (limiter) return limiter;
  const env = getEnv().rateLimit;
  if (env.upstashUrl && env.upstashToken) {
    limiter = new UpstashRateLimiter(env.upstashUrl, env.upstashToken);
  } else {
    limiter = new MemoryRateLimiter();
  }
  return limiter;
}

export async function enforceRateLimit(options: {
  userId: string;
  isAuthenticated: boolean;
}): Promise<{ remaining: number; resetAt: number }> {
  const env = getEnv().rateLimit;
  const max = options.isAuthenticated
    ? env.authenticatedPerHour
    : env.anonymousPerHour;
  const result = await getLimiter().limit(
    `generate:${options.userId}`,
    max,
    60 * 60 * 1000,
  );
  if (!result.success) {
    throw new AppError("RATE_LIMITED", {
      details: { resetAt: result.resetAt },
    });
  }
  return { remaining: result.remaining, resetAt: result.resetAt };
}

export function resetRateLimitForTests() {
  memoryBuckets.clear();
  limiter = new MemoryRateLimiter();
}

export function setRateLimiterForTests(custom: RateLimiter | null) {
  limiter = custom;
}
