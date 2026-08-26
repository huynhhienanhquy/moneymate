import { Platform } from 'react-native';
import { sessionStorage } from '@/storage/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload?.message || 'Không thể kết nối máy chủ', payload?.errors);
  return payload.data as T;
}

async function refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await sessionStorage.getRefreshToken();
    if (!refreshToken) throw new ApiError(401, 'Phiên đăng nhập đã hết hạn');
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const tokens = await parseResponse<{ accessToken: string; refreshToken: string }>(response);
    accessToken = tokens.accessToken;
    await sessionStorage.setRefreshToken(tokens.refreshToken);
    return tokens.accessToken;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    const token = await refreshSession();
    headers.set('Authorization', `Bearer ${token}`);
    return parseResponse<T>(await fetch(`${API_URL}${path}`, { ...init, headers }));
  }
  return parseResponse<T>(response);
}

export const mobilePlatform = Platform.OS === 'ios' ? 'ios' : 'android';
