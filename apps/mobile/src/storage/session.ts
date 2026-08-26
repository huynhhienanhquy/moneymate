import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'moneymate.refresh-token';
const USER_KEY = 'moneymate.user';

export const sessionStorage = {
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  }),
  getUser: () => SecureStore.getItemAsync(USER_KEY),
  setUser: (user: string) => SecureStore.setItemAsync(USER_KEY, user),
  clear: () => Promise.all([
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY)
  ]).then(() => undefined)
};
