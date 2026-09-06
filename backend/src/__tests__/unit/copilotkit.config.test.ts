import { getCopilotKitConfig } from '../../config/copilotkit';

describe('CopilotKit runtime configuration', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('is disabled by default without requiring an OpenAI API key', () => {
    delete process.env.COPILOTKIT_ENABLED;
    delete process.env.OPENAI_API_KEY;

    expect(getCopilotKitConfig()).toEqual(expect.objectContaining({
      enabled: false,
      model: 'openai/gpt-4o-mini',
      maxSteps: 3,
      maxOutputTokens: 1500,
      maxMessageChars: 4000,
      modelTimeoutMs: 45_000,
      rateLimitMaxRequests: 60,
      rateLimitWindowMs: 60_000,
    }));
  });

  it('fails closed when enabled without an OpenAI API key', () => {
    process.env.COPILOTKIT_ENABLED = 'true';
    delete process.env.OPENAI_API_KEY;

    expect(() => getCopilotKitConfig()).toThrow(
      'OPENAI_API_KEY is required when COPILOTKIT_ENABLED=true',
    );
  });

  it('loads bounded CopilotKit settings when enabled', () => {
    process.env.COPILOTKIT_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.COPILOT_MODEL = 'openai/gpt-4.1-mini';
    process.env.COPILOT_MAX_STEPS = '4';
    process.env.COPILOT_MAX_OUTPUT_TOKENS = '2048';
    process.env.COPILOT_MAX_MESSAGE_CHARS = '5000';
    process.env.COPILOT_MODEL_TIMEOUT_MS = '30000';
    process.env.COPILOT_RATE_LIMIT_MAX_REQUESTS = '90';
    process.env.COPILOT_RATE_LIMIT_WINDOW_MS = '120000';

    expect(getCopilotKitConfig()).toEqual({
      enabled: true,
      openaiApiKey: 'test-api-key',
      model: 'openai/gpt-4.1-mini',
      maxSteps: 4,
      maxOutputTokens: 2048,
      maxMessageChars: 5000,
      modelTimeoutMs: 30_000,
      rateLimitMaxRequests: 90,
      rateLimitWindowMs: 120_000,
    });
  });

  it('rejects a model provider that does not match the configured OpenAI credential', () => {
    process.env.COPILOTKIT_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.COPILOT_MODEL = 'anthropic/claude-sonnet-4-6';

    expect(() => getCopilotKitConfig()).toThrow('COPILOT_MODEL must use the openai/ provider');
  });

  it.each([
    ['COPILOT_MAX_STEPS', '0'],
    ['COPILOT_MAX_STEPS', '9'],
    ['COPILOT_MAX_OUTPUT_TOKENS', '255'],
    ['COPILOT_MAX_OUTPUT_TOKENS', '4097'],
    ['COPILOT_MAX_MESSAGE_CHARS', '255'],
    ['COPILOT_MAX_MESSAGE_CHARS', '20001'],
    ['COPILOT_MODEL_TIMEOUT_MS', '4999'],
    ['COPILOT_MODEL_TIMEOUT_MS', '120001'],
    ['COPILOT_RATE_LIMIT_MAX_REQUESTS', '4'],
    ['COPILOT_RATE_LIMIT_MAX_REQUESTS', '601'],
    ['COPILOT_RATE_LIMIT_WINDOW_MS', '9999'],
    ['COPILOT_RATE_LIMIT_WINDOW_MS', '3600001'],
  ])('rejects an unsafe %s value', (name, value) => {
    process.env.COPILOTKIT_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env[name] = value;

    expect(() => getCopilotKitConfig()).toThrow(`${name} must be an integer`);
  });
});
