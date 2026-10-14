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

/**
 * Create security response for the security workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @param status - The status value required by the operation.
 * @param code - The stable machine-readable code used to classify the outcome.
 * @param message - The human-readable outcome message returned to the caller.
 * @param additionalHeaders - The additional headers value required by the operation.
 * @returns The resulting security value for the caller.
 */
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

/**
 * Send express security error through the security boundary.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param response - The response object used to return the operation result.
 * @param status - The status value required by the operation.
 * @param code - The stable machine-readable code used to classify the outcome.
 * @param message - The human-readable outcome message returned to the caller.
 * @param additionalHeaders - The additional headers value required by the operation.
 * @returns The resulting security value for the caller.
 */
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

  /**
   * Claim a Copilot thread for one owner and reject cross-user reuse.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
   * @param threadId - The stable identifier of the record targeted by the operation.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns The resulting security value for the caller.
   */
  claim(threadId: string, userId: string): 'owned' | 'forbidden' | 'capacity' {
    const owner = this.owners.get(threadId);
    if (owner) return owner === userId ? 'owned' : 'forbidden';
    if (this.owners.size >= MAX_TRACKED_THREADS) return 'capacity';
    this.owners.set(threadId, userId);
    return 'owned';
  }

  /**
   * Determine whether owned by applies.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
   * @param threadId - The stable identifier of the record targeted by the operation.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns `true` when the condition is satisfied; otherwise `false`.
   */
  isOwnedBy(threadId: string, userId: string): boolean {
    return this.owners.get(threadId) === userId;
  }
}

export class CopilotRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  /**
   * Initialize a security instance with its required dependencies.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
   * @param maximumRequests - The maximum requests value required by the operation.
   * @param windowMs - The window ms value required by the operation.
   */
  constructor(
    private readonly maximumRequests: number,
    private readonly windowMs: number,
  ) {}

  /**
   * Consume one rate-limit allowance for the normalized Copilot caller key.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
   * @param rawKey - The raw key value required by the operation.
   * @param now - The reference time used to make the calculation deterministic.
   * @returns The resulting security value for the caller.
   */
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

/**
 * Create copilot rate limit middleware for the security workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param config - Settings that customize how the operation runs.
 * @returns The resulting security value for the caller.
 */
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

/**
 * Copilot body parser error handler for security.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param error - The failure value to classify, report, or propagate.
 * @param _request - The request value required by the operation.
 * @param response - The response object used to return the operation result.
 * @param next - The callback that continues the middleware pipeline or receives an error.
 * @returns The resulting security value for the caller.
 */
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

/**
 * Assert that copilot transport security satisfies the security workflow's requirements.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @returns Nothing; the operation is complete when the function returns.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
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

/**
 * Parse and validate envelope body for the security workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @returns A promise containing the resulting security value.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
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

/**
 * Parse and validate identifier for the security workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @param value - The value to transform or evaluate.
 * @param name - The name value required by the operation.
 * @returns The resulting security value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
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

/**
 * Content length for security.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param content - The content value required by the operation.
 * @returns The resulting security value for the caller.
 */
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

/**
 * Assert that message lengths satisfies the security workflow's requirements.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @param messages - The messages value required by the operation.
 * @param maximumChars - The maximum chars value required by the operation.
 * @returns Nothing; the operation is complete when the function returns.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
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

/**
 * Assert that owned satisfies the security workflow's requirements.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @param ownership - The ownership value required by the operation.
 * @param threadId - The stable identifier of the record targeted by the operation.
 * @param userId - The identifier of the user whose data is being processed.
 * @param mayClaim - The may claim value required by the operation.
 * @returns Nothing; the operation is complete when the function returns.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
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

  /**
   * Initialize a security instance with its required dependencies.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
   * @param config - Settings that customize how the operation runs.
   */
  constructor(private readonly config: CopilotKitConfig) {}

  /**
   * Authorize route for security.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
   * @param request - The incoming request and its authenticated or validated input.
   * @param route - The route value required by the operation.
   * @param user - The user value required by the operation.
   * @param runner - The runner value required by the operation.
   * @returns A promise that resolves after the operation completes.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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
      /**
       * Stop run for security.
       *
       * Use it at the CopilotKit boundary so AI-driven operations follow the application's security rules.
       * @returns Nothing; the operation is complete when the function returns.
       */
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
