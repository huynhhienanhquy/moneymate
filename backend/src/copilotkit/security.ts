import { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import type { AgentRunner, RouteInfo } from '@copilotkit/runtime/v2';
import { CopilotKitConfig } from '../config/copilotkit';
import { getConfiguredFrontendOrigins, isConfiguredFrontendOrigin } from '../config/cors';
import type { AuthenticatedUser } from '../middlewares/auth';

export const COPILOT_REQUEST_BODY_LIMIT = '64kb';
const MAX_TRACKED_RATE_LIMIT_KEYS = 10_000;
const MAX_TRACKED_THREADS = 10_000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface CopilotEnvelope {
  body?: unknown;
}

interface RunBody {
  threadId?: unknown;
  runId?: unknown;
  messages?: unknown;
}

const createSecurityResponse = (
  request: Request,
  status: number,
  code: string,
  message: string,
  additionalHeaders: Record<string, string> = {},
): Response => {
  const requestId = request.headers.get('x-request-id') || undefined;
  const headers = new Headers({
    'content-type': 'application/json',
    'cache-control': 'no-store',
    ...additionalHeaders,
  });
  if (requestId) headers.set('x-request-id', requestId);

  return new Response(JSON.stringify({
    success: false,
    code,
    message,
    errors: [],
    ...(requestId ? { requestId } : {}),
  }), { status, headers });
};

const sendExpressSecurityError = (
  response: ExpressResponse,
  status: number,
  code: string,
  message: string,
  additionalHeaders: Record<string, string> = {},
) => {
  response.setHeader('Cache-Control', 'no-store');
  for (const [name, value] of Object.entries(additionalHeaders)) {
    response.setHeader(name, value);
  }
  return response.status(status).json({
    success: false,
    code,
    message,
    errors: [],
    ...(response.locals.requestId ? { requestId: response.locals.requestId } : {}),
  });
};

export class CopilotThreadOwnership {
  private readonly owners = new Map<string, string>();

  claim(threadId: string, userId: string): 'owned' | 'forbidden' | 'capacity' {
    const owner = this.owners.get(threadId);
    if (owner) return owner === userId ? 'owned' : 'forbidden';
    if (this.owners.size >= MAX_TRACKED_THREADS) return 'capacity';
    this.owners.set(threadId, userId);
    return 'owned';
  }

  isOwnedBy(threadId: string, userId: string): boolean {
    return this.owners.get(threadId) === userId;
  }
}

export class CopilotRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly maximumRequests: number,
    private readonly windowMs: number,
  ) {}

  consume(rawKey: string, now = Date.now()): { allowed: boolean; remaining: number; resetAt: number } {
    let key = rawKey || 'unknown';
    let entry = this.entries.get(key);

    if (!entry && this.entries.size >= MAX_TRACKED_RATE_LIMIT_KEYS) {
      for (const [candidateKey, candidate] of this.entries) {
        if (candidate.resetAt <= now) this.entries.delete(candidateKey);
      }
      if (this.entries.size >= MAX_TRACKED_RATE_LIMIT_KEYS) key = 'overflow';
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

export const createCopilotRateLimitMiddleware = (config: CopilotKitConfig) => {
  const limiter = new CopilotRateLimiter(config.rateLimitMaxRequests, config.rateLimitWindowMs);

  return (request: ExpressRequest, response: ExpressResponse, next: NextFunction) => {
    const result = limiter.consume(request.ip || request.socket.remoteAddress || 'unknown');
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

    response.setHeader('RateLimit-Limit', String(config.rateLimitMaxRequests));
    response.setHeader('RateLimit-Remaining', String(result.remaining));
    response.setHeader('RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      return sendExpressSecurityError(
        response,
        429,
        'RATE_LIMITED',
        'Too many Copilot requests. Please try again later.',
        { 'Retry-After': String(retryAfterSeconds) },
      );
    }
    return next();
  };
};

export const copilotBodyParserErrorHandler = (
  error: unknown,
  _request: ExpressRequest,
  response: ExpressResponse,
  next: NextFunction,
) => {
  const bodyError = error as { type?: string; status?: number };
  if (bodyError?.type === 'entity.too.large' || bodyError?.status === 413) {
    return sendExpressSecurityError(
      response,
      413,
      'PAYLOAD_TOO_LARGE',
      'Copilot request payload is too large.',
    );
  }
  if (bodyError?.type === 'entity.parse.failed' || bodyError?.status === 400) {
    return sendExpressSecurityError(
      response,
      400,
      'INVALID_REQUEST',
      'Copilot request payload is invalid.',
    );
  }
  return next(error);
};

export const assertCopilotTransportSecurity = (request: Request): void => {
  const origin = request.headers.get('origin');
  const configuredOrigins = getConfiguredFrontendOrigins();

  if (origin && !isConfiguredFrontendOrigin(origin, configuredOrigins)) {
    throw createSecurityResponse(request, 403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed.');
  }

  if (process.env.NODE_ENV === 'production') {
    let requestProtocol: string;
    let originProtocol: string;
    try {
      requestProtocol = new URL(request.url).protocol;
      originProtocol = origin ? new URL(origin).protocol : 'https:';
    } catch {
      throw createSecurityResponse(request, 403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed.');
    }
    if (requestProtocol !== 'https:' || originProtocol !== 'https:') {
      throw createSecurityResponse(request, 426, 'HTTPS_REQUIRED', 'HTTPS is required for Copilot requests.');
    }
  }
};

const parseEnvelopeBody = async (request: Request): Promise<RunBody> => {
  let envelope: CopilotEnvelope;
  try {
    envelope = await request.clone().json() as CopilotEnvelope;
  } catch {
    throw createSecurityResponse(request, 400, 'INVALID_REQUEST', 'Copilot request payload is invalid.');
  }

  let body = envelope?.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      throw createSecurityResponse(request, 400, 'INVALID_REQUEST', 'Copilot request payload is invalid.');
    }
  }
  return body && typeof body === 'object' ? body as RunBody : {};
};

const parseIdentifier = (request: Request, value: unknown, name: 'thread' | 'run'): string => {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > 200
    || value.trim() !== value
    || /[\u0000-\u001f\u007f\s]/u.test(value)
  ) {
    throw createSecurityResponse(
      request,
      400,
      `INVALID_${name.toUpperCase()}_ID`,
      `Copilot ${name} identifier is invalid.`,
    );
  }
  return value;
};

const contentLength = (content: unknown): number => {
  if (typeof content === 'string') return content.length;
  if (!Array.isArray(content)) return 0;
  return content.reduce((length, part) => {
    if (typeof part === 'string') return length + part.length;
    if (!part || typeof part !== 'object') return length;
    const text = (part as { text?: unknown }).text;
    return length + (typeof text === 'string' ? text.length : 0);
  }, 0);
};

const assertMessageLengths = (request: Request, messages: unknown, maximumChars: number): void => {
  if (!Array.isArray(messages)) return;
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const candidate = message as { role?: unknown; content?: unknown };
    if (candidate.role === 'user' && contentLength(candidate.content) > maximumChars) {
      throw createSecurityResponse(
        request,
        413,
        'MESSAGE_TOO_LONG',
        `Copilot messages must not exceed ${maximumChars} characters.`,
      );
    }
  }
};

const assertOwned = (
  request: Request,
  ownership: CopilotThreadOwnership,
  threadId: string,
  userId: string,
  mayClaim: boolean,
) => {
  const ownershipResult = mayClaim
    ? ownership.claim(threadId, userId)
    : ownership.isOwnedBy(threadId, userId) ? 'owned' : 'forbidden';

  if (ownershipResult === 'capacity') {
    throw createSecurityResponse(
      request,
      503,
      'THREAD_CAPACITY_REACHED',
      'Copilot thread capacity has been reached. Please try again later.',
    );
  }
  if (ownershipResult !== 'owned') {
    throw createSecurityResponse(
      request,
      403,
      'THREAD_ACCESS_DENIED',
      'This Copilot thread is not available to the current user.',
    );
  }
};

export class CopilotSecurityGuard {
  private readonly ownership = new CopilotThreadOwnership();

  constructor(private readonly config: CopilotKitConfig) {}

  async authorizeRoute(
    request: Request,
    route: RouteInfo,
    user: AuthenticatedUser,
    runner: AgentRunner,
  ): Promise<void> {
    if (route.method === 'inspector/metadata' && process.env.NODE_ENV === 'production') {
      throw createSecurityResponse(request, 404, 'NOT_FOUND', 'Resource not found.');
    }

    if (route.method.startsWith('threads/') || route.method.startsWith('memories/') || route.method === 'cpk-debug-events') {
      throw createSecurityResponse(request, 404, 'NOT_FOUND', 'Resource not found.');
    }

    if (!['agent/run', 'agent/suggest', 'agent/connect'].includes(route.method)) {
      if (route.method === 'agent/stop') {
        const threadId = parseIdentifier(request, route.threadId, 'thread');
        assertOwned(request, this.ownership, threadId, user.id, false);
      }
      return;
    }

    const body = await parseEnvelopeBody(request);
    assertMessageLengths(request, body.messages, this.config.maxMessageChars);

    if (route.method === 'agent/suggest') return;

    const threadId = parseIdentifier(request, body.threadId, 'thread');
    assertOwned(request, this.ownership, threadId, user.id, true);

    if (route.method === 'agent/run') {
      const runId = parseIdentifier(request, body.runId, 'run');
      const stopRun = () => {
        void runner.stop({ threadId, runId }).catch(() => undefined);
      };

      if (request.signal.aborted) {
        stopRun();
        throw createSecurityResponse(request, 499, 'CLIENT_CLOSED_REQUEST', 'Copilot request was cancelled.');
      }
      request.signal.addEventListener('abort', stopRun, { once: true });
    }
  }
}
