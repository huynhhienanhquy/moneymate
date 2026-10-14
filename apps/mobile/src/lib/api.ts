import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { ClientPlatform } from '@moneymate/contracts';
import { sessionStorage } from '@/storage/session';

/**
 * Return expo dev host required by the api workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @returns The resulting api value for the caller.
 */
function getExpoDevHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  try {
    return new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`)
      .hostname;
  } catch {
    return null;
  }
}

/**
 * Resolve api url from the available api context.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @returns The resulting api value for the caller.
 */
function resolveApiUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  if (Platform.OS === 'web') return 'http://localhost:5000/api';

  const devHost = getExpoDevHost();
  if (devHost) return `http://${devHost}:5000/api`;

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';
}

export const API_URL = resolveApiUrl();
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let sessionExpiredHandler: (() => void | Promise<void>) | null = null;

export class ApiError extends Error {
  /**
   * Initialize a api instance with its required dependencies.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @param status - The status value required by the operation.
   * @param message - The human-readable outcome message returned to the caller.
   * @param details - The details value required by the operation.
   */
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Parse and validate response for the api workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param response - The response object used to return the operation result.
 * @returns A promise containing the resulting api value.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      payload?.message || 'Không thể kết nối máy chủ',
      payload?.errors,
    );
  return payload.data as T;
}

/**
 * Refresh session used by the api workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @returns A promise containing the resulting api value.
 */
async function refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await sessionStorage.getRefreshToken();
    if (Platform.OS !== 'web' && !refreshToken) {
      accessToken = null;
      await sessionStorage.clear().catch(() => undefined);
      await sessionExpiredHandler?.();
      throw new ApiError(401, 'Phiên đăng nhập đã hết hạn');
    }
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: refreshToken
          ? { 'Content-Type': 'application/json' }
          : undefined,
        body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
        credentials: Platform.OS === 'web' ? 'include' : undefined,
      });
      const tokens = await parseResponse<{
        accessToken: string;
        refreshToken?: string;
      }>(response);
      if (Platform.OS !== 'web' && !tokens.refreshToken) {
        throw new ApiError(401, 'Máy chủ không trả refresh token cho thiết bị');
      }
      accessToken = tokens.accessToken;
      if (tokens.refreshToken)
        await sessionStorage.setRefreshToken(tokens.refreshToken);
      return tokens.accessToken;
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        accessToken = null;
        await sessionStorage.clear().catch(() => undefined);
        await sessionExpiredHandler?.();
      }
      throw error;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * Set access token used by the api workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param token - The authentication or continuation token used by the operation.
 * @returns Nothing; the operation is complete when the function returns.
 */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Set session expired handler used by the api workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param handler - The handler value required by the operation.
 * @returns Nothing; the operation is complete when the function returns.
 */
export function setSessionExpiredHandler(
  handler: (() => void | Promise<void>) | null,
) {
  sessionExpiredHandler = handler;
}

/**
 * Api request for api.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param path - The file-system location or file value used by the operation.
 * @param init - The init value required by the operation.
 * @param retry - The retry value required by the operation.
 * @returns A promise containing the resulting api value.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const credentials = Platform.OS === 'web' ? 'include' : init.credentials;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials,
  });
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    const token = await refreshSession();
    headers.set('Authorization', `Bearer ${token}`);
    const retriedResponse = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials,
    });
    if (retriedResponse.status === 401 || retriedResponse.status === 403) {
      accessToken = null;
      await sessionStorage.clear().catch(() => undefined);
      await sessionExpiredHandler?.();
    }
    return parseResponse<T>(retriedResponse);
  }
  return parseResponse<T>(response);
}

/**
 * Api download for api.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param path - The file-system location or file value used by the operation.
 * @param retry - The retry value required by the operation.
 * @returns A promise containing the resulting api value.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export async function apiDownload(
  path: string,
  retry = true,
): Promise<Uint8Array> {
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const credentials = Platform.OS === 'web' ? 'include' : undefined;
  let response = await fetch(`${API_URL}${path}`, { headers, credentials });
  if (response.status === 401 && retry) {
    const token = await refreshSession();
    headers.set('Authorization', `Bearer ${token}`);
    response = await fetch(`${API_URL}${path}`, { headers, credentials });
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      payload?.message || 'Không thể tải báo cáo',
      payload?.errors,
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

export const mobilePlatform: ClientPlatform =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
