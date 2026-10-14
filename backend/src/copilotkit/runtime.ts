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

/**
 * Create runtime error response for the runtime workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's runtime rules.
 * @param request - The incoming request and its authenticated or validated input.
 * @returns The resulting runtime value for the caller.
 */
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

/**
 * Create copilot kit router for the runtime workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's runtime rules.
 * @param config - Settings that customize how the operation runs.
 * @param dependencies - The dependencies value required by the operation.
 * @returns The resulting runtime value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
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
  /**
   * Resolve user from the available runtime context.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's runtime rules.
   * @param request - The incoming request and its authenticated or validated input.
   * @returns The resulting runtime value for the caller.
   */
  const resolveUser = (request: Request) => {
    const cached = authenticatedUsers.get(request);
    if (cached) return cached;
    const user = resolveCopilotUser(request);
    authenticatedUsers.set(request, user);
    return user;
  };

  const runtime = new CopilotRuntime({
    /**
     * Agents for runtime.
     *
     * Use it at the CopilotKit boundary so AI-driven operations follow the application's runtime rules.
     * @param props - The properties that configure this React component.
     * @returns A promise containing the resulting runtime value.
     */
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
      /**
       * Handle request for the runtime workflow.
       *
       * Use it at the CopilotKit boundary so AI-driven operations follow the application's runtime rules.
       * @param props - The properties that configure this React component.
       * @returns A promise that resolves after the operation completes.
       */
      onRequest: async ({ request }) => {
        assertCopilotTransportSecurity(request);
        await resolveUser(request);
      },
      /**
       * Handle before handler for the runtime workflow.
       *
       * Use it at the CopilotKit boundary so AI-driven operations follow the application's runtime rules.
       * @param props - The properties that configure this React component.
       * @returns A promise that resolves after the operation completes.
       */
      onBeforeHandler: async ({ request, route }) => {
        const user = await resolveUser(request);
        await security.authorizeRoute(request, route, user, runtime.runner);
      },
      /**
       * Map a failed runtime operation into user-visible state.
       *
       * Use it at the CopilotKit boundary so AI-driven operations follow the application's runtime rules.
       * @param props - The properties that configure this React component.
       * @returns The resulting runtime value for the caller.
       */
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
