const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/$/, '');

export const getConfiguredFrontendOrigins = (): string[] => (
  process.env.FRONTEND_URL || 'http://localhost:5173'
)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

export const isConfiguredFrontendOrigin = (
  origin: string,
  configuredOrigins = getConfiguredFrontendOrigins(),
): boolean => configuredOrigins.includes(normalizeOrigin(origin));

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
