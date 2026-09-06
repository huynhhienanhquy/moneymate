import type { AgentRunner, RouteInfo } from '@copilotkit/runtime/v2';
import { CopilotKitConfig } from '../../config/copilotkit';
import { CopilotSecurityGuard, CopilotThreadOwnership } from '../../copilotkit/security';

describe('CopilotKit security guard', () => {
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

  it('keeps a thread bound to the first authenticated user', () => {
    const ownership = new CopilotThreadOwnership();

    expect(ownership.claim('thread-1', 'user-1')).toBe('owned');
    expect(ownership.claim('thread-1', 'user-1')).toBe('owned');
    expect(ownership.claim('thread-1', 'user-2')).toBe('forbidden');
    expect(ownership.isOwnedBy('thread-1', 'user-2')).toBe(false);
  });

  it('stops the exact model run when the client disconnects', async () => {
    const controller = new AbortController();
    const stop = jest.fn().mockResolvedValue(true);
    const runner = { stop } as unknown as AgentRunner;
    const guard = new CopilotSecurityGuard(config);
    const route = { method: 'agent/run', agentId: 'default' } as RouteInfo;
    const request = new Request('http://localhost/api/copilotkit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        method: 'agent/run',
        params: { agentId: 'default' },
        body: { threadId: 'thread-cancel', runId: 'run-cancel', messages: [] },
      }),
      signal: controller.signal,
    });

    await guard.authorizeRoute(
      request,
      route,
      { id: 'user-1', email: 'user-1@example.com', role: 'USER' },
      runner,
    );
    controller.abort();
    await Promise.resolve();

    expect(stop).toHaveBeenCalledWith({ threadId: 'thread-cancel', runId: 'run-cancel' });
  });
});
