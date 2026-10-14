import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'moneymate.refresh-token';
const USER_KEY = 'moneymate.user';
const isWeb = Platform.OS === 'web';

const webStorage = {
  /**
   * Return session required by the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @param key - The key value required by the operation.
   * @returns The resulting session value for the caller.
   */
  get: (key: string) =>
    Promise.resolve(
      typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
    ),
  /**
   * Set session used by the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @param key - The key value required by the operation.
   * @param value - The value to transform or evaluate.
   * @returns The resulting session value for the caller.
   */
  set: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return Promise.resolve();
  },
  /**
   * Remove session from the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @param key - The key value required by the operation.
   * @returns The resulting session value for the caller.
   */
  remove: (key: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export const sessionStorage = {
  // Browser sessions use the backend's HttpOnly cookie. Never persist a web
  // refresh token in JavaScript-readable storage.
  /**
   * Return refresh token required by the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @returns The resulting session value for the caller.
   */
  getRefreshToken: () =>
    isWeb ? Promise.resolve(null) : SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  /**
   * Set refresh token used by the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @param token - The authentication or continuation token used by the operation.
   * @returns The resulting session value for the caller.
   */
  setRefreshToken: (token: string) =>
    isWeb
      ? Promise.resolve()
      : SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
  /**
   * Return user required by the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @returns The resulting session value for the caller.
   */
  getUser: () =>
    isWeb ? webStorage.get(USER_KEY) : SecureStore.getItemAsync(USER_KEY),
  /**
   * Set user used by the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @param user - The user value required by the operation.
   * @returns The resulting session value for the caller.
   */
  setUser: (user: string) =>
    isWeb
      ? webStorage.set(USER_KEY, user)
      : SecureStore.setItemAsync(USER_KEY, user),
  /**
   * Clear session maintained by the session workflow.
   *
   * Use it when session data must be read from or written to local persistence.
   * @returns The resulting session value for the caller.
   */
  clear: () =>
    isWeb
      ? Promise.all([
          webStorage.remove(REFRESH_TOKEN_KEY),
          webStorage.remove(USER_KEY),
        ]).then(() => undefined)
      : Promise.all([
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
          SecureStore.deleteItemAsync(USER_KEY),
        ]).then(() => undefined),
};
