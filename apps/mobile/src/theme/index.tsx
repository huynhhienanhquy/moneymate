import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import {
  colors,
  componentSizes,
  darkColors,
  gradients,
  lightColors,
  motion,
  radius,
  spacing,
  touchTarget,
  typography,
} from '@moneymate/design-tokens';
import { keyValueStorage } from '@/storage/key-value';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AppTheme = ReturnType<typeof buildTheme>;

const THEME_KEY = 'moneymate.theme';

function buildTheme(colorScheme: 'light' | 'dark') {
  return {
    colorScheme,
    dark: colorScheme === 'dark',
    colors: { ...(colorScheme === 'dark' ? darkColors : lightColors), ...colors },
    gradients: {
      brand: [...gradients.brand] as [string, string, ...string[]],
      background: [...(colorScheme === 'dark' ? gradients.darkBackground : gradients.background)] as [string, string, ...string[]],
    },
    spacing,
    radius,
    typography,
    motion,
    touchTarget,
    sizes: componentSizes,
  } as const;
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');
// Compatibility fallback for non-React utilities. UI code should use useAppTheme().
export const theme = lightTheme;

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: 'system',
  setMode: () => undefined,
  toggleTheme: () => undefined,
});

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    void keyValueStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') setModeState(stored);
    });
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void keyValueStorage.setItem(THEME_KEY, nextMode);
  }, []);
  const effectiveScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const activeTheme = effectiveScheme === 'dark' ? darkTheme : lightTheme;
  const toggleTheme = useCallback(() => setMode(effectiveScheme === 'dark' ? 'light' : 'dark'), [effectiveScheme, setMode]);
  const value = useMemo(() => ({ theme: activeTheme, mode, setMode, toggleTheme }), [activeTheme, mode, setMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
