import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

jest.mock('@copilotkit/runtime/v2', () => ({
  BuiltInAgent: jest.fn().mockImplementation((options) => ({ options })),
  CopilotRuntime: jest.fn().mockImplementation((options) => ({ options, runner: options.runner })),
  InMemoryAgentRunner: jest.fn().mockImplementation((options) => ({
    options,
    stop: jest.fn().mockResolvedValue(true),
  })),
  defineTool: jest.fn().mockImplementation((options) => options),
}));

jest.mock('@copilotkit/runtime/v2/express', () => {
  const expressModule = jest.requireActual<typeof import('express')>('express');

  return {
    createCopilotExpressHandler: jest.fn().mockImplementation(({ runtime, basePath, hooks }) => {
      const router = expressModule.Router();
      router.post(basePath, async (request, response) => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(request.headers)) {
          if (typeof value === 'string') headers.set(name, value);
        }
        const protocol = request.get('X-Forwarded-Proto') === 'https' ? 'https' : 'http';
        const fetchRequest = new Request(`${protocol}://localhost${basePath}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(request.body),
        });

        try {
          await hooks?.onRequest?.({ request: fetchRequest, path: basePath, runtime });
          const envelope = request.body as {
            method: string;
            params?: { agentId?: string; threadId?: string };
          };
          const route = envelope.method === 'agent/stop'
            ? {
                method: envelope.method,
                agentId: envelope.params?.agentId,
                threadId: envelope.params?.threadId,
              }
            : envelope.method.startsWith('agent/')
              ? { method: envelope.method, agentId: envelope.params?.agentId }
              : { method: envelope.method };
          await hooks?.onBeforeHandler?.({ request: fetchRequest, path: basePath, runtime, route });
          const agents = await runtime.options.agents({ request: fetchRequest });
          response.json({ agents: Object.keys(agents) });
        } catch (error) {
          const runtimeResponse = error instanceof Response
            ? error
            : await hooks?.onError?.({ error, request: fetchRequest, path: basePath, runtime });
          response.status(runtimeResponse?.status || 500);
          runtimeResponse?.headers.forEach((value: string, name: string) => response.setHeader(name, value));
          response.send(runtimeResponse ? await runtimeResponse.text() : 'Runtime error');
        }
      });
      return router;
    }),
  };
});

import { createCopilotKitRouter } from '../../copilotkit/runtime';
import { CopilotKitConfig } from '../../config/copilotkit';
import { requestId } from '../../middlewares/request-id';

describe('CopilotKit Express runtime', () => {
  const originalEnvironment = { ...process.env };
  const config: CopilotKitConfig = {
    enabled: true,
    model: 'openai/gpt-4o-mini',
    maxSteps: 3,
    maxOutputTokens: 1500,
    maxMessageChars: 4000,
    modelTimeoutMs: 45_000,
    rateLimitMaxRequests: 60,
    rateLimitWindowMs: 60_000,
    openaiApiKey: 'test-api-key',
  };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'copilotkit-test-access-secret-at-least-32-characters';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  const createApp = () => {
    const app = express();
    app.use(requestId);
    app.use(express.json());
    app.use(createCopilotKitRouter(config));
    return app;
  };

  const createToken = (userId: string) => jwt.sign(
    { userId, email: `${userId}@example.com`, role: 'USER' },
    process.env.JWT_ACCESS_SECRET!,
    { algorithm: 'HS256', expiresIn: '15m' },
  );

  it('refuses to create a runtime while the feature is disabled', () => {
    expect(() => createCopilotKitRouter({ ...config, enabled: false })).toThrow(
      'Cannot create CopilotKit runtime while COPILOTKIT_ENABLED is false',
    );
  });

  it('rejects unauthenticated runtime discovery', async () => {
    const response = await request(createApp())
      .post('/api/copilotkit')
      .send({ method: 'info' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(expect.objectContaining({
      success: false,
      code: 'UNAUTHORIZED',
    }));
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('exposes the request-scoped default agent to an authenticated caller', async () => {
    const token = createToken('user-123');

    const response = await request(createApp())
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'info' });

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).toContain('default');
  });

  it.each(['info', 'agent/run', 'agent/connect', 'agent/stop', 'agent/suggest', 'inspector/metadata'])(
    'requires authentication for the %s operation',
    async (method) => {
      const params = method.startsWith('agent/')
        ? { agentId: 'default', ...(method === 'agent/stop' ? { threadId: 'thread-auth' } : {}) }
        : undefined;
      const body = ['agent/run', 'agent/connect', 'agent/suggest'].includes(method)
        ? { threadId: 'thread-auth', runId: 'run-auth', messages: [] }
        : undefined;
      const response = await request(createApp())
        .post('/api/copilotkit')
        .send({ method, params, body });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    },
  );

  it('prevents another user from connecting to or stopping an owned thread', async () => {
    const app = createApp();
    const ownerToken = createToken('owner-user');
    const otherToken = createToken('other-user');

    const runResponse = await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        method: 'agent/run',
        params: { agentId: 'default' },
        body: { threadId: 'private-thread', runId: 'run-1', messages: [] },
      });
    const connectResponse = await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        method: 'agent/connect',
        params: { agentId: 'default' },
        body: { threadId: 'private-thread', runId: 'run-2', messages: [] },
      });
    const stopResponse = await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        method: 'agent/stop',
        params: { agentId: 'default', threadId: 'private-thread' },
      });

    expect(runResponse.status).toBe(200);
    expect(connectResponse.status).toBe(403);
    expect(connectResponse.body.code).toBe('THREAD_ACCESS_DENIED');
    expect(stopResponse.status).toBe(403);
    expect(stopResponse.body.code).toBe('THREAD_ACCESS_DENIED');
  });

  it('rejects user messages above the configured character limit', async () => {
    const response = await request(createApp())
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${createToken('user-long-message')}`)
      .send({
        method: 'agent/run',
        params: { agentId: 'default' },
        body: {
          threadId: 'thread-long-message',
          runId: 'run-long-message',
          messages: [{ role: 'user', content: 'x'.repeat(config.maxMessageChars + 1) }],
        },
      });

    expect(response.status).toBe(413);
    expect(response.body.code).toBe('MESSAGE_TOO_LONG');
  });

  it('rate limits the Copilot endpoint independently', async () => {
    const app = express();
    app.use(requestId);
    app.use(express.json());
    app.use(createCopilotKitRouter({ ...config, rateLimitMaxRequests: 5 }));
    const token = createToken('rate-limited-user');

    for (let index = 0; index < 5; index += 1) {
      const allowed = await request(app)
        .post('/api/copilotkit')
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'info' });
      expect(allowed.status).toBe(200);
    }
    const blocked = await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'info' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('accepts only configured browser origins', async () => {
    const response = await request(createApp())
      .post('/api/copilotkit')
      .set('Origin', 'http://evil.example')
      .set('Authorization', `Bearer ${createToken('origin-user')}`)
      .send({ method: 'info' });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  it('requires HTTPS and hides inspector metadata in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://money.example';
    const app = createApp();
    const token = createToken('production-user');

    const insecure = await request(app)
      .post('/api/copilotkit')
      .set('Origin', 'https://money.example')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'info' });
    const inspector = await request(app)
      .post('/api/copilotkit')
      .set('X-Forwarded-Proto', 'https')
      .set('Origin', 'https://money.example')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'inspector/metadata' });

    expect(insecure.status).toBe(426);
    expect(insecure.body.code).toBe('HTTPS_REQUIRED');
    expect(inspector.status).toBe(404);
    expect(inspector.body.code).toBe('NOT_FOUND');
  });
});
