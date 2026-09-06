import { Router } from 'express';
import {
  BuiltInAgent,
  CopilotRuntime,
  InMemoryAgentRunner,
} from '@copilotkit/runtime/v2';
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express';
import { CopilotKitConfig } from '../config/copilotkit';
import { buildMoneyMateAgent } from './financial-agent';
import { resolveCopilotUser } from './auth';
import {
  assertCopilotTransportSecurity,
  CopilotSecurityGuard,
  createCopilotRateLimitMiddleware,
} from './security';

export interface CopilotKitRouterDependencies {
  buildAgent?: (
    user: Awaited<ReturnType<typeof resolveCopilotUser>>,
    config: CopilotKitConfig,
    context: { requestId?: string },
  ) => BuiltInAgent;
}

const createRuntimeErrorResponse = (request: Request): Response => {
  const requestId = request.headers.get('x-request-id') || undefined;
  const headers = new Headers({ 'content-type': 'application/json' });
  if (requestId) headers.set('x-request-id', requestId);

  return new Response(JSON.stringify({
    success: false,
    code: 'COPILOT_RUNTIME_ERROR',
    message: 'Copilot runtime request failed',
    errors: [],
    ...(requestId ? { requestId } : {}),
  }), { status: 500, headers });
};

export const createCopilotKitRouter = (
  config: CopilotKitConfig,
  dependencies: CopilotKitRouterDependencies = {},
): Router => {
  if (!config.enabled) {
    throw new Error('Cannot create CopilotKit runtime while COPILOTKIT_ENABLED is false');
  }

  const authenticatedUsers = new WeakMap<Request, ReturnType<typeof resolveCopilotUser>>();
  const security = new CopilotSecurityGuard(config);
  const createAgent = dependencies.buildAgent ?? buildMoneyMateAgent;
  const resolveUser = (request: Request) => {
    const cached = authenticatedUsers.get(request);
    if (cached) return cached;
    const user = resolveCopilotUser(request);
    authenticatedUsers.set(request, user);
    return user;
  };

  const runtime = new CopilotRuntime({
    agents: async ({ request }) => {
      const user = await resolveUser(request);
      return {
        default: createAgent(user, config, {
          requestId: request.headers.get('x-request-id') || undefined,
        }),
      };
    },
    runner: new InMemoryAgentRunner({
      maxThreads: 1000,
      maxRunsPerThread: 10,
      maxBytes: 50 * 1024 * 1024,
      onConcurrentRun: 'throw',
    }),
    forwardHeaders: { allow: [] },
    telemetryProperties: { application: 'moneymate' },
    debug: false,
  });

  const copilotHandler = createCopilotExpressHandler({
    runtime,
    basePath: '/api/copilotkit',
    mode: 'single-route',
    cors: false,
    activateChannels: false,
    hooks: {
      onRequest: async ({ request }) => {
        assertCopilotTransportSecurity(request);
        await resolveUser(request);
      },
      onBeforeHandler: async ({ request, route }) => {
        const user = await resolveUser(request);
        await security.authorizeRoute(request, route, user, runtime.runner);
      },
      onError: ({ error, request }) => {
        if (error instanceof Response) return error;
        console.error({
          operation: 'copilotkit-runtime',
          requestId: request.headers.get('x-request-id') || undefined,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });
        return createRuntimeErrorResponse(request);
      },
    },
  });

  const router = Router();
  router.use((request, response, next) => {
    if (response.locals.requestId) {
      request.headers['x-request-id'] = response.locals.requestId;
    }
    next();
  });
  router.use('/api/copilotkit', createCopilotRateLimitMiddleware(config));
  router.use(copilotHandler);
  return router;
};
