import { API_BASE_URL } from '@/config/api';

export const parseCopilotKitEnabled = (rawValue: string | undefined): boolean => {
  const value = rawValue?.trim().toLowerCase();
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('VITE_COPILOTKIT_ENABLED must be either true or false');
};

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
