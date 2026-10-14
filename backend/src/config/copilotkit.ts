const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_MAX_STEPS = 3;
const DEFAULT_MAX_OUTPUT_TOKENS = 1500;
const DEFAULT_MAX_MESSAGE_CHARS = 4000;
const DEFAULT_MODEL_TIMEOUT_MS = 45_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

export interface CopilotKitConfig {
  enabled: boolean;
  model: string;
  maxSteps: number;
  maxOutputTokens: number;
  maxMessageChars: number;
  modelTimeoutMs: number;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
  openaiApiKey: string;
}

/**
 * Parse and validate enabled for the copilotkit workflow.
 *
 * Use it while deriving the application's copilotkit settings.
 * @param rawValue - The untrusted configuration value to parse and validate.
 * @returns The resulting copilotkit value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
const parseEnabled = (rawValue: string | undefined): boolean => {
  const value = rawValue?.trim().toLowerCase();
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('COPILOTKIT_ENABLED must be either true or false');
};

/**
 * Parse and validate bounded integer for the copilotkit workflow.
 *
 * Use it while deriving the application's copilotkit settings.
 * @param name - The name value required by the operation.
 * @param rawValue - The untrusted configuration value to parse and validate.
 * @param fallback - The value used when no explicit input is configured.
 * @param minimum - The lowest accepted numeric value.
 * @param maximum - The highest accepted numeric value.
 * @returns The resulting copilotkit value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
const parseBoundedInteger = (
  name: string,
  rawValue: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  if (!rawValue?.trim()) return fallback;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
};

/**
 * Return copilot kit config required by the copilotkit workflow.
 *
 * Use it while deriving the application's copilotkit settings.
 * @returns The resulting copilotkit value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export const getCopilotKitConfig = (): CopilotKitConfig => {
  const enabled = parseEnabled(process.env.COPILOTKIT_ENABLED);
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() || '';
  const model = process.env.COPILOT_MODEL?.trim() || DEFAULT_MODEL;

  if (enabled && !openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required when COPILOTKIT_ENABLED=true');
  }
  if (enabled && !model.startsWith('openai/')) {
    throw new Error('COPILOT_MODEL must use the openai/ provider while OPENAI_API_KEY is configured');
  }

  return {
    enabled,
    model,
    maxSteps: parseBoundedInteger('COPILOT_MAX_STEPS', process.env.COPILOT_MAX_STEPS, DEFAULT_MAX_STEPS, 1, 8),
    maxOutputTokens: parseBoundedInteger(
      'COPILOT_MAX_OUTPUT_TOKENS',
      process.env.COPILOT_MAX_OUTPUT_TOKENS,
      DEFAULT_MAX_OUTPUT_TOKENS,
      256,
      4096,
    ),
    maxMessageChars: parseBoundedInteger(
      'COPILOT_MAX_MESSAGE_CHARS',
      process.env.COPILOT_MAX_MESSAGE_CHARS,
      DEFAULT_MAX_MESSAGE_CHARS,
      256,
      20_000,
    ),
    modelTimeoutMs: parseBoundedInteger(
      'COPILOT_MODEL_TIMEOUT_MS',
      process.env.COPILOT_MODEL_TIMEOUT_MS,
      DEFAULT_MODEL_TIMEOUT_MS,
      5_000,
      120_000,
    ),
    rateLimitMaxRequests: parseBoundedInteger(
      'COPILOT_RATE_LIMIT_MAX_REQUESTS',
      process.env.COPILOT_RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_RATE_LIMIT_MAX_REQUESTS,
      5,
      600,
    ),
    rateLimitWindowMs: parseBoundedInteger(
      'COPILOT_RATE_LIMIT_WINDOW_MS',
      process.env.COPILOT_RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS,
      10_000,
      3_600_000,
    ),
    openaiApiKey,
  };
};
