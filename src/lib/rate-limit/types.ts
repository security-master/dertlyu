export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  check(identifier: string, limit: number): Promise<RateLimitResult>;
}
