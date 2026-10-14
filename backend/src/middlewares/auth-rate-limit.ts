import { NextFunction, Request, Response } from 'express';
import { sendError } from '../common/response';

const MAX_TRACKED_CLIENTS = 10_000;

interface RateEntry { count: number; resetAt: number }

/**
 * Positive integer for auth rate limit.
 *
 * Use it in the request pipeline when auth rate limit processing is required.
 * @param value - The value to transform or evaluate.
 * @param fallback - The value used when no explicit input is configured.
 * @returns The resulting auth rate limit value for the caller.
 */
function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export class AuthRateLimiter {
  private entries = new Map<string, RateEntry>();

  /**
   * Initialize a auth rate limit instance with its required dependencies.
   *
   * Use it in the request pipeline when auth rate limit processing is required.
   * @param maximumRequests - The maximum requests value required by the operation.
   * @param windowMs - The window ms value required by the operation.
   */
  constructor(
    private readonly maximumRequests: number,
    private readonly windowMs: number,
  ) {}

  /**
   * Consume one rate-limit allowance for the normalized authentication key.
   *
   * Use it in the request pipeline when auth rate limit processing is required.
   * @param rawKey - The raw key value required by the operation.
   * @param now - The reference time used to make the calculation deterministic.
   * @returns The resulting auth rate limit value for the caller.
   */
  consume(rawKey: string, now = Date.now()) {
    let key = rawKey || 'unknown';
    let entry = this.entries.get(key);
    if (!entry && this.entries.size >= MAX_TRACKED_CLIENTS) {
      for (const [candidate, current] of this.entries) {
        if (current.resetAt <= now) this.entries.delete(candidate);
      }
      if (this.entries.size >= MAX_TRACKED_CLIENTS) key = 'overflow';
      entry = this.entries.get(key);
    }
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.entries.set(key, entry);
    }
    entry.count += 1;
    return {
      allowed: entry.count <= this.maximumRequests,
      remaining: Math.max(0, this.maximumRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

/**
 * Create auth rate limit middleware for the auth rate limit workflow.
 *
 * Use it in the request pipeline when auth rate limit processing is required.
 * @param kind - The kind value required by the operation.
 * @returns The resulting auth rate limit value for the caller.
 */
export function createAuthRateLimitMiddleware(kind: 'login' | 'register') {
  const isLogin = kind === 'login';
  const limit = positiveInteger(
    process.env[isLogin ? 'AUTH_LOGIN_RATE_LIMIT_MAX' : 'AUTH_REGISTER_RATE_LIMIT_MAX'],
    isLogin ? 10 : 5,
  );
  const windowMs = positiveInteger(
    process.env[isLogin ? 'AUTH_LOGIN_RATE_LIMIT_WINDOW_MS' : 'AUTH_REGISTER_RATE_LIMIT_WINDOW_MS'],
    isLogin ? 15 * 60_000 : 60 * 60_000,
  );
  const limiter = new AuthRateLimiter(limit, windowMs);

  return (request: Request, response: Response, next: NextFunction) => {
    const result = limiter.consume(request.ip || request.socket.remoteAddress || 'unknown');
    response.setHeader('RateLimit-Limit', String(limit));
    response.setHeader('RateLimit-Remaining', String(result.remaining));
    response.setHeader('RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    if (!result.allowed) {
      response.setHeader('Retry-After', String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))));
      return sendError(
        response,
        `Too many ${kind} attempts. Please try again later.`,
        429,
        [],
        'AUTH_RATE_LIMITED',
      );
    }
    return next();
  };
}
