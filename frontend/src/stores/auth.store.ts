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
  setToken: (accessToken: string) => void;
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

    login: (user, accessToken) => {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true, isInitializing: false });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.user);
      set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
    },

    setToken: (accessToken) => {
      set({ accessToken, isAuthenticated: true });
    },

    setUser: (user) => {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      set({ user });
    },

    setInitializing: (isInitializing) => {
      set({ isInitializing });
    }
  };
});
