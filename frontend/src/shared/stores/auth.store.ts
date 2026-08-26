import { create } from 'zustand';
import type { UserDto } from '@moneymate/contracts';

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
    const cachedUser = localStorage.getItem('mm_user');
    if (cachedUser) initialUser = JSON.parse(cachedUser);
  } catch {}

  return {
    user: initialUser,
    accessToken: null,
    isAuthenticated: !!initialUser,
    isInitializing: true,

    login: (user, accessToken) => {
      localStorage.setItem('mm_user', JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true, isInitializing: false });
    },

    logout: () => {
      localStorage.removeItem('mm_user');
      set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
    },

    setToken: (accessToken) => {
      set({ accessToken, isAuthenticated: true });
    },

    setUser: (user) => {
      localStorage.setItem('mm_user', JSON.stringify(user));
      set({ user });
    },

    setInitializing: (isInitializing) => {
      set({ isInitializing });
    }
  };
});
