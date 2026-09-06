export const resolveApiBaseUrl = (configuredUrl: string | undefined, isDevelopment: boolean): string => {
  const baseUrl = configuredUrl || '/api';
  if (isDevelopment) {
    try {
      const url = new URL(baseUrl);
      if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && /^\/api\/?$/.test(url.pathname)) {
        return '/api';
      }
    } catch { /* Relative API paths already use the current origin. */ }
  }
  return baseUrl;
};

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.DEV);
