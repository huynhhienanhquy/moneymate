import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { API_BASE_URL } from '@/config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial to send refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach current Access Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Startup and 401 recovery must share one refresh: refresh cookies are single-use.
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
        const { accessToken } = response.data.data;
        useAuthStore.getState().setToken(accessToken);
        return accessToken;
      })
      .catch((error) => {
        // Only an explicit authentication rejection invalidates the session.
        // A network failure or server restart must not erase the cached login.
        if ([401, 403].includes(error.response?.status)) {
          useAuthStore.getState().logout();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh request itself fails
    if (!originalRequest || /\/auth\/(refresh|login|register|logout)(?:$|\?)/.test(originalRequest.url || '')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const currentToken = useAuthStore.getState().accessToken;
      if (!currentToken && !refreshPromise) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      // A late 401 may belong to the token that another request already refreshed.
      const sentToken = originalRequest.headers?.Authorization;
      const accessToken = currentToken && sentToken && sentToken !== `Bearer ${currentToken}`
        ? currentToken
        : await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
