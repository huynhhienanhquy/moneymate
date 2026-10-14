/**
 * Normalize origin into the cors workflow's canonical form.
 *
 * Use it while deriving the application's cors settings.
 * @param origin - The request origin to normalize or authorize.
 * @returns The resulting cors value for the caller.
 */
const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/$/, '');

/**
 * Return configured frontend origins required by the cors workflow.
 *
 * Use it while deriving the application's cors settings.
 * @returns The resulting cors value for the caller.
 */
export const getConfiguredFrontendOrigins = (): string[] => (
  process.env.FRONTEND_URL || 'http://localhost:5173'
)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

/**
 * Determine whether configured frontend origin applies.
 *
 * Use it while deriving the application's cors settings.
 * @param origin - The request origin to normalize or authorize.
 * @param configuredOrigins - The allowlist of configured frontend origins.
 * @returns `true` when the condition is satisfied; otherwise `false`.
 */
export const isConfiguredFrontendOrigin = (
  origin: string,
  configuredOrigins = getConfiguredFrontendOrigins(),
): boolean => configuredOrigins.includes(normalizeOrigin(origin));

/**
 * Determine whether allowed cors origin applies.
 *
 * Use it while deriving the application's cors settings.
 * @param origin - The request origin to normalize or authorize.
 * @param configuredOrigins - The allowlist of configured frontend origins.
 * @returns `true` when the condition is satisfied; otherwise `false`.
 */
export const isAllowedCorsOrigin = (
  origin: string | undefined,
  configuredOrigins = getConfiguredFrontendOrigins(),
): boolean => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (configuredOrigins.includes(normalized)) return true;
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(normalized);
    return url.protocol === 'http:'
      && ['localhost', '127.0.0.1', '10.10.10.183'].includes(url.hostname);
  } catch {
    return false;
  }
};
