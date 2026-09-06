import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { BuiltInAgent } from '@copilotkit/runtime/v2';
import mainApp from '../../app';
import { CopilotKitConfig } from '../../config/copilotkit';
import { createCopilotKitRouter } from '../../copilotkit/runtime';
import { requestId } from '../../middlewares/request-id';

const config: CopilotKitConfig = {
  enabled: true,
  model: 'openai/gpt-4o-mini',
  maxSteps: 3,
  maxOutputTokens: 1500,
  maxMessageChars: 4000,
  modelTimeoutMs: 45_000,
  rateLimitMaxRequests: 60,
  rateLimitWindowMs: 60_000,
  openaiApiKey: 'integration-test-key',
};

const createToken = (userId: string) => jwt.sign(
  { userId, email: `${userId}@example.com`, role: 'USER' },
  process.env.JWT_ACCESS_SECRET!,
  { algorithm: 'HS256', expiresIn: '15m' },
);

const runBody = (threadId: string, runId: string) => ({
  threadId,
  runId,
  state: {},
  messages: [],
  tools: [],
  context: [],
  forwardedProps: {},
});

const createTestApp = () => {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  app.use(createCopilotKitRouter(config, {
    buildAgent: () => new BuiltInAgent({
      type: 'custom',
      factory: async function* emptyAgent() {
        return;
      },
    }),
  }));
  return app;
};

describe('CopilotKit API integration', () => {
  const originalEnvironment = { ...process.env };

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.JWT_ACCESS_SECRET = 'copilotkit-integration-access-secret-at-least-32-characters';
  });

  afterAll(() => {
    process.env = { ...originalEnvironment };
  });

  it('serves an authenticated runtime handshake and rejects missing auth', async () => {
    const app = createTestApp();
    const unauthorized = await request(app)
      .post('/api/copilotkit')
      .send({ method: 'info' });
    const authenticated = await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${createToken('handshake-user')}`)
      .send({ method: 'info' });

    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.code).toBe('UNAUTHORIZED');
    expect(authenticated.status).toBe(200);
    expect(JSON.stringify(authenticated.body)).toContain('default');
  });

  it('streams valid AG-UI lifecycle events without calling an external model', async () => {
    const response = await request(createTestApp())
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${createToken('stream-user')}`)
      .send({
        method: 'agent/run',
        params: { agentId: 'default' },
        body: runBody('stream-thread', 'stream-run'),
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('RUN_STARTED');
    expect(response.text).toContain('RUN_FINISHED');
  });

  it('blocks cross-user thread access and non-configured browser origins', async () => {
    const app = createTestApp();
    const ownerToken = createToken('thread-owner');
    const attackerToken = createToken('thread-attacker');

    await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        method: 'agent/run',
        params: { agentId: 'default' },
        body: runBody('owned-thread', 'owner-run'),
      })
      .expect(200);

    const connect = await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({
        method: 'agent/connect',
        params: { agentId: 'default' },
        body: runBody('owned-thread', 'attacker-run'),
      });
    const stop = await request(app)
      .post('/api/copilotkit')
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({
        method: 'agent/stop',
        params: { agentId: 'default', threadId: 'owned-thread' },
      });
    const badOrigin = await request(app)
      .post('/api/copilotkit')
      .set('Origin', 'http://attacker.example')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ method: 'info' });

    expect(connect.status).toBe(403);
    expect(connect.body.code).toBe('THREAD_ACCESS_DENIED');
    expect(stop.status).toBe(403);
    expect(stop.body.code).toBe('THREAD_ACCESS_DENIED');
    expect(badOrigin.status).toBe(403);
    expect(badOrigin.body.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  it('keeps the legacy AI endpoint registered', async () => {
    const response = await request(mainApp)
      .post('/api/ai/chat')
      .send({ message: 'hello' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });
});
