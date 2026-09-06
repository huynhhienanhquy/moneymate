import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'moneymate.refresh-token';
const USER_KEY = 'moneymate.user';
const isWeb = Platform.OS === 'web';

const webStorage = {
  get: (key: string) => Promise.resolve(typeof localStorage === 'undefined' ? null : localStorage.getItem(key)),
  set: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return Promise.resolve();
  },
  remove: (key: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export const sessionStorage = {
  // Browser sessions use the backend's HttpOnly cookie. Never persist a web
  // refresh token in JavaScript-readable storage.
  getRefreshToken: () => isWeb ? Promise.resolve(null) : SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => isWeb
    ? Promise.resolve()
    : SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
  getUser: () => isWeb ? webStorage.get(USER_KEY) : SecureStore.getItemAsync(USER_KEY),
  setUser: (user: string) => isWeb ? webStorage.set(USER_KEY, user) : SecureStore.setItemAsync(USER_KEY, user),
  clear: () => isWeb
    ? Promise.all([webStorage.remove(REFRESH_TOKEN_KEY), webStorage.remove(USER_KEY)]).then(() => undefined)
    : Promise.all([
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]).then(() => undefined),
};
