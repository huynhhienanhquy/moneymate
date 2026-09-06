jest.mock('@copilotkit/runtime/v2', () => {
  class BuiltInAgent {
    public readonly options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }

    clone() {
      return new BuiltInAgent(this.options);
    }

    run() {
      return { subscribe: jest.fn() };
    }

    abortRun() {}
  }

  return {
    BuiltInAgent,
    defineTool: jest.fn().mockImplementation((options) => options),
  };
});

import { CopilotKitConfig } from '../../config/copilotkit';
import { buildMoneyMateAgent } from '../../copilotkit/financial-agent';

describe('MoneyMate Copilot agent', () => {
  const config: CopilotKitConfig = {
    enabled: true,
    model: 'openai/gpt-4o-mini',
    maxSteps: 3,
    maxOutputTokens: 1500,
    maxMessageChars: 4000,
    modelTimeoutMs: 100,
    rateLimitMaxRequests: 60,
    rateLimitWindowMs: 60_000,
    openaiApiKey: 'test-api-key',
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('locks model limits and read-only tools into the server-created agent', () => {
    const agent = buildMoneyMateAgent(
      { id: 'owner-user', email: 'owner@example.com', role: 'USER' },
      config,
    ) as unknown as { options: Record<string, unknown> };

    expect(agent.options).toEqual(expect.objectContaining({
      model: config.model,
      maxSteps: 3,
      maxOutputTokens: 1500,
      overridableProperties: [],
      forwardSystemMessages: false,
      forwardDeveloperMessages: false,
    }));
    expect(agent.options.tools).toHaveLength(5);
  });

  it('aborts both the agent and its request clone at the configured timeout', () => {
    jest.useFakeTimers();
    const agent = buildMoneyMateAgent(
      { id: 'owner-user', email: 'owner@example.com', role: 'USER' },
      config,
    );
    const clone = agent.clone();
    const abortAgent = jest.spyOn(agent, 'abortRun');
    const abortClone = jest.spyOn(clone, 'abortRun');
    const input = { threadId: 'thread-1', runId: 'run-1' } as Parameters<typeof agent.run>[0];

    agent.run(input);
    clone.run(input);
    jest.advanceTimersByTime(config.modelTimeoutMs - 1);
    expect(abortAgent).not.toHaveBeenCalled();
    expect(abortClone).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(abortAgent).toHaveBeenCalledTimes(1);
    expect(abortClone).toHaveBeenCalledTimes(1);
  });
});
