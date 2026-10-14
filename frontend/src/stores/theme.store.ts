import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants/storage';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

/**
 * Apply theme to the theme workflow.
 *
 * Use it to keep theme client state consistent across consumers.
 * @param theme - The theme value required by the operation.
 * @returns Nothing; the operation is complete when the function returns.
 */
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

  /**
   * Set theme used by the theme workflow.
   *
   * Use it to keep theme client state consistent across consumers.
   * @param theme - The theme value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    applyTheme(theme);
    set({ theme });
  },

  /**
   * Restore the saved theme preference and apply it to the document.
   *
   * Use it to keep theme client state consistent across consumers.
   * @returns Nothing; the operation is complete when the function returns.
   */
  initTheme: () => {
    const saved = (localStorage.getItem(STORAGE_KEYS.theme) as Theme) || 'dark';
    applyTheme(saved);
    set({ theme: saved });
  },

  /**
   * Toggle theme in the theme interface.
   *
   * Use it to keep theme client state consistent across consumers.
   * @returns Nothing; the operation is complete when the function returns.
   */
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
