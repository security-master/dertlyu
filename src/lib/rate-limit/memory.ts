import { getEnv } from "@/lib/config/env";
import type { RateLimiter, RateLimitResult } from "./types";

interface MemoryEntry {
  count: number;
  resetAt: number;
}

export class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, MemoryEntry>();

  async check(identifier: string, limit: number): Promise<RateLimitResult> {
    const env = getEnv();
    const windowMs = env.RATE_LIMIT_WINDOW_SECONDS * 1000;
    const now = Date.now();

    const entry = this.store.get(identifier);

    if (!entry || now >= entry.resetAt) {
      const resetAt = now + windowMs;
      this.store.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetAt,
      };
    }

    if (entry.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    entry.count += 1;
    return {
      success: true,
      limit,
      remaining: limit - entry.count,
      reset: entry.resetAt,
    };
  }
}
