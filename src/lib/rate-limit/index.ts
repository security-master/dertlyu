import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getEnv, isUpstashConfigured } from "@/lib/config/env";
import { MemoryRateLimiter } from "./memory";
import type { RateLimiter, RateLimitResult } from "./types";

export class UpstashRateLimiter implements RateLimiter {
  private ratelimit: Ratelimit;

  constructor() {
    const env = getEnv();
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });

    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        env.RATE_LIMIT_ANONYMOUS,
        `${env.RATE_LIMIT_WINDOW_SECONDS} s`
      ),
      prefix: "dertlyu:ratelimit",
    });
  }

  async check(identifier: string, limit: number): Promise<RateLimitResult> {
    const result = await this.ratelimit.limit(identifier);

    return {
      success: result.success,
      limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
}

let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = isUpstashConfigured()
      ? new UpstashRateLimiter()
      : new MemoryRateLimiter();
  }
  return rateLimiterInstance;
}

export function getRateLimitForUser(isAuthenticated: boolean): number {
  const env = getEnv();
  return isAuthenticated
    ? env.RATE_LIMIT_AUTHENTICATED
    : env.RATE_LIMIT_ANONYMOUS;
}
