import { API_BASE_URL } from '@/config/api';

/**
 * Parse and validate copilot kit enabled for the copilotkit workflow.
 *
 * Use it while deriving the application's copilotkit settings.
 * @param rawValue - The untrusted configuration value to parse and validate.
 * @returns The resulting copilotkit value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export const parseCopilotKitEnabled = (rawValue: string | undefined): boolean => {
  const value = rawValue?.trim().toLowerCase();
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('VITE_COPILOTKIT_ENABLED must be either true or false');
};

/**
 * Build copilot kit runtime url used by the copilotkit workflow.
 *
 * Use it while deriving the application's copilotkit settings.
 * @param apiBaseUrl - The api base url value required by the operation.
 * @returns The resulting copilotkit value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export const buildCopilotKitRuntimeUrl = (apiBaseUrl: string): string => {
  const normalizedBaseUrl = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!normalizedBaseUrl) {
    throw new Error('VITE_API_URL must not be empty when CopilotKit is enabled');
  }
  return `${normalizedBaseUrl}/copilotkit`;
};

export const COPILOTKIT_FRONTEND_ENABLED = parseCopilotKitEnabled(
  import.meta.env.VITE_COPILOTKIT_ENABLED,
);

export const COPILOTKIT_RUNTIME_URL = buildCopilotKitRuntimeUrl(API_BASE_URL);
