import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import Storage from 'expo-sqlite/kv-store';
import type { LoginResponse, UserDto } from '@moneymate/contracts';
import { apiRequest, mobilePlatform, setAccessToken } from '@/lib/api';
import { sessionStorage } from '@/storage/session';

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
}

let deviceId: string | null = null;

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
  initialize: async () => {
    try {
      const raw = await sessionStorage.getUser();
      const cached = raw ? JSON.parse(raw) : null;
      if (!cached?.user || !await sessionStorage.getRefreshToken()) {
        set({ initialized: true, user: null });
        return;
      }
      deviceId = cached.deviceId;
      set({ user: cached.user });
      const profile = await apiRequest<UserDto>('/users/profile');
      await sessionStorage.setUser(JSON.stringify({ user: profile, deviceId }));
      set({ user: profile, initialized: true });
    } catch {
      await sessionStorage.clear();
      await Storage.removeItem('moneymate-query-cache');
      setAccessToken(null);
      set({ user: null, initialized: true });
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const currentDeviceId = await getDeviceId();
      const result = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          platform: mobilePlatform,
          deviceId: currentDeviceId,
          deviceName: Device.modelName || Device.deviceName || 'Mobile device',
          appVersion: '1.0.0',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      }, false);
      if (!result.refreshToken) throw new Error('Máy chủ không trả refresh token cho mobile');
      setAccessToken(result.accessToken);
      await sessionStorage.setRefreshToken(result.refreshToken);
      await sessionStorage.setUser(JSON.stringify({ user: result.user, deviceId: currentDeviceId }));
      set({ user: result.user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Đăng nhập thất bại', loading: false });
      throw error;
    }
  },
  logout: async () => {
    const refreshToken = await sessionStorage.getRefreshToken().catch(() => null);
    // Logout must always work offline: remove local credentials and update UI
    // first, then revoke the server session as a best-effort background task.
    await sessionStorage.clear().catch(() => undefined);
    await Storage.removeItem('moneymate-query-cache').catch(() => undefined);
    setAccessToken(null);
    set({ user: null, loading: false, error: null });
    if (refreshToken) void apiRequest('/auth/logout', {
      method: 'POST', body: JSON.stringify({ refreshToken })
    }, false).catch(() => undefined);
  },
  deleteAccount: async (password) => {
    await apiRequest('/users/profile', { method: 'DELETE', body: JSON.stringify({ password }) });
    await sessionStorage.clear();
    await Storage.removeItem('moneymate-query-cache');
    setAccessToken(null);
    set({ user: null });
  },
  unlockWithBiometrics: async () => {
    if (!await LocalAuthentication.hasHardwareAsync() || !await LocalAuthentication.isEnrolledAsync()) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Mở khóa MoneyMate',
      cancelLabel: 'Hủy',
      disableDeviceFallback: false
    });
    return result.success;
  },
  updateCachedUser: async (user) => {
    const currentDeviceId = await getDeviceId();
    await sessionStorage.setUser(JSON.stringify({ user, deviceId: currentDeviceId }));
    set({ user });
  }
}));
