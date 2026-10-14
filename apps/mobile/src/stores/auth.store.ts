import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import type { LoginResponse, UserDto } from '@moneymate/contracts';
import {
  ApiError,
  apiRequest,
  mobilePlatform,
  setAccessToken,
} from '@/lib/api';
import { sessionStorage } from '@/storage/session';
import { keyValueStorage } from '@/storage/key-value';

interface AuthState {
  user: UserDto | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  updateCachedUser: (user: UserDto) => Promise<void>;
  expireSession: () => Promise<void>;
}

let deviceId: string | null = null;

/**
 * Return device id required by the auth workflow.
 *
 * Use it to keep auth client state consistent across consumers.
 * @returns A promise containing the resulting auth value.
 */
async function getDeviceId() {
  if (deviceId) return deviceId;
  const stored = await sessionStorage.getUser();
  const parsed = stored ? JSON.parse(stored) : null;
  deviceId = parsed?.deviceId || Crypto.randomUUID();
  return deviceId;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  loading: false,
  error: null,
  /**
   * Restore the persisted mobile session and determine whether biometric unlock is required.
   *
   * Use it to keep auth client state consistent across consumers.
   * @returns A promise that resolves after the operation completes.
   */
  initialize: async () => {
    let cached: { user?: UserDto; deviceId?: string } | null = null;
    try {
      const raw = await sessionStorage.getUser();
      cached = raw ? JSON.parse(raw) : null;
      const hasSessionCredential =
        mobilePlatform === 'web' ||
        Boolean(await sessionStorage.getRefreshToken());
      if (!cached?.user || !hasSessionCredential) {
        set({ initialized: true, user: null });
        return;
      }
      deviceId = cached.deviceId ?? null;
      set({ user: cached.user });
    } catch {
      await sessionStorage.clear().catch(() => undefined);
      await keyValueStorage
        .removeItem('moneymate-query-cache')
        .catch(() => undefined);
      setAccessToken(null);
      set({ user: null, initialized: true });
      return;
    }

    try {
      const profile = await apiRequest<UserDto>('/users/profile');
      await sessionStorage.setUser(JSON.stringify({ user: profile, deviceId }));
      set({ user: profile, initialized: true });
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        await sessionStorage.clear().catch(() => undefined);
        await keyValueStorage
          .removeItem('moneymate-query-cache')
          .catch(() => undefined);
        setAccessToken(null);
        set({ user: null, initialized: true });
        return;
      }
      // Keep the authenticated cache available when offline or the server is temporarily unavailable.
      set({ user: cached!.user!, initialized: true });
    }
  },
  /**
   * Authenticate the user and persist the resulting mobile session.
   *
   * Use it to keep auth client state consistent across consumers.
   * @param email - The email value required by the operation.
   * @param password - The password value required by the operation.
   * @returns A promise that resolves after the operation completes.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const currentDeviceId = await getDeviceId();
      const result = await apiRequest<LoginResponse>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            platform: mobilePlatform,
            deviceId: currentDeviceId,
            deviceName:
              Device.modelName || Device.deviceName || 'Mobile device',
            appVersion: '1.0.0',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        },
        false,
      );
      if (mobilePlatform !== 'web' && !result.refreshToken) {
        throw new Error('Máy chủ không trả refresh token cho mobile');
      }
      setAccessToken(result.accessToken);
      if (result.refreshToken)
        await sessionStorage.setRefreshToken(result.refreshToken);
      await sessionStorage.setUser(
        JSON.stringify({ user: result.user, deviceId: currentDeviceId }),
      );
      set({ user: result.user, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Đăng nhập thất bại',
        loading: false,
      });
      throw error;
    }
  },
  /**
   * Revoke the active session and clear all locally persisted credentials.
   *
   * Use it to keep auth client state consistent across consumers.
   * @returns A promise that resolves after the operation completes.
   */
  logout: async () => {
    const refreshToken = await sessionStorage
      .getRefreshToken()
      .catch(() => null);
    const cached = await sessionStorage
      .getUser()
      .then((raw) => (raw ? JSON.parse(raw) : null))
      .catch(() => null);
    const unregister = cached?.deviceId
      ? apiRequest('/notifications/devices', {
          method: 'DELETE',
          body: JSON.stringify({ deviceId: cached.deviceId }),
        }).catch(() => undefined)
      : Promise.resolve();
    // Logout must always work offline: remove local credentials and update UI
    // first, then revoke the server session as a best-effort background task.
    await sessionStorage.clear().catch(() => undefined);
    await keyValueStorage
      .removeItem('moneymate-query-cache')
      .catch(() => undefined);
    setAccessToken(null);
    set({ user: null, loading: false, error: null });
    if (refreshToken || mobilePlatform === 'web')
      void apiRequest(
        '/auth/logout',
        {
          method: 'POST',
          body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
        },
        false,
      ).catch(() => undefined);
    void unregister;
  },
  /**
   * Delete account through the auth workflow.
   *
   * Use it to keep auth client state consistent across consumers.
   * @param password - The password value required by the operation.
   * @returns A promise that resolves after the operation completes.
   */
  deleteAccount: async (password) => {
    await apiRequest('/users/profile', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    await sessionStorage.clear();
    await keyValueStorage.removeItem('moneymate-query-cache');
    setAccessToken(null);
    set({ user: null });
  },
  /**
   * Unlock the persisted session after successful device biometric verification.
   *
   * Use it to keep auth client state consistent across consumers.
   * @returns A promise containing the resulting auth value.
   */
  unlockWithBiometrics: async () => {
    if (
      !(await LocalAuthentication.hasHardwareAsync()) ||
      !(await LocalAuthentication.isEnrolledAsync())
    )
      return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Mở khóa MoneyMate',
      cancelLabel: 'Hủy',
      disableDeviceFallback: false,
    });
    return result.success;
  },
  /**
   * Update cached user while preserving the auth workflow's rules.
   *
   * Use it to keep auth client state consistent across consumers.
   * @param user - The user value required by the operation.
   * @returns A promise that resolves after the operation completes.
   */
  updateCachedUser: async (user) => {
    const currentDeviceId = await getDeviceId();
    await sessionStorage.setUser(
      JSON.stringify({ user, deviceId: currentDeviceId }),
    );
    set({ user });
  },
  /**
   * Clear expired credentials and return the auth store to a signed-out state.
   *
   * Use it to keep auth client state consistent across consumers.
   * @returns A promise that resolves after the operation completes.
   */
  expireSession: async () => {
    await sessionStorage.clear().catch(() => undefined);
    await keyValueStorage
      .removeItem('moneymate-query-cache')
      .catch(() => undefined);
    setAccessToken(null);
    set({
      user: null,
      initialized: true,
      loading: false,
      error: 'Phiên đăng nhập đã hết hạn',
    });
  },
}));
