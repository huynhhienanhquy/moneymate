import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants/storage';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    applyTheme(theme);
    set({ theme });
  },

  initTheme: () => {
    const saved = (localStorage.getItem(STORAGE_KEYS.theme) as Theme) || 'dark';
    applyTheme(saved);
    set({ theme: saved });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
