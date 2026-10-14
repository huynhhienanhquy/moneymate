import { create } from 'zustand';
import type { UserDto } from '@moneymate/contracts';
import { STORAGE_KEYS } from '@/constants/storage';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (user: UserDto, accessToken: string) => void;
  logout: () => void;
  setToken: (accessToken: string, user?: UserDto) => void;
  setUser: (user: UserDto) => void;
  setInitializing: (isInitializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Try to load cached user info on startup
  let initialUser: UserDto | null = null;
  try {
    const cachedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (cachedUser) initialUser = JSON.parse(cachedUser);
  } catch {}

  return {
    user: initialUser,
    accessToken: null,
    isAuthenticated: !!initialUser,
    isInitializing: true,

    /**
     * Store the authenticated user and access token after a successful login.
     *
     * Use it to keep auth client state consistent across consumers.
     * @param user - The user value required by the operation.
     * @param accessToken - The authentication or continuation token used by the operation.
     * @returns Nothing; the operation is complete when the function returns.
     */
    login: (user, accessToken) => {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true, isInitializing: false });
    },

    /**
     * Clear the browser authentication state after logout or session expiry.
     *
     * Use it to keep auth client state consistent across consumers.
     * @returns Nothing; the operation is complete when the function returns.
     */
    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.user);
      set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
    },

    /**
     * Set token used by the auth workflow.
     *
     * Use it to keep auth client state consistent across consumers.
     * @param accessToken - The authentication or continuation token used by the operation.
     * @param user - The user value required by the operation.
     * @returns Nothing; the operation is complete when the function returns.
     */
    setToken: (accessToken, user) => {
      if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      set((state) => ({ accessToken, user: user || state.user, isAuthenticated: true }));
    },

    /**
     * Set user used by the auth workflow.
     *
     * Use it to keep auth client state consistent across consumers.
     * @param user - The user value required by the operation.
     * @returns Nothing; the operation is complete when the function returns.
     */
    setUser: (user) => {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      set({ user });
    },

    /**
     * Set initializing used by the auth workflow.
     *
     * Use it to keep auth client state consistent across consumers.
     * @param isInitializing - The is initializing value required by the operation.
     * @returns Nothing; the operation is complete when the function returns.
     */
    setInitializing: (isInitializing) => {
      set({ isInitializing });
    }
  };
});
