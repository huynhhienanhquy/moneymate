import { NextFunction, Request, Response } from 'express';
import { sendError } from '../common/response';

const MAX_TRACKED_CLIENTS = 10_000;

interface RateEntry { count: number; resetAt: number }

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export class AuthRateLimiter {
  private entries = new Map<string, RateEntry>();

  constructor(
    private readonly maximumRequests: number,
    private readonly windowMs: number,
  ) {}

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
