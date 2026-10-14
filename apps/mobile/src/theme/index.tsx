import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
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

/**
 * Build theme used by the theme workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param colorScheme - The color scheme value required by the operation.
 * @returns The resulting theme value for the caller.
 */
function buildTheme(colorScheme: 'light' | 'dark') {
  return {
    colorScheme,
    dark: colorScheme === 'dark',
    colors: {
      ...(colorScheme === 'dark' ? darkColors : lightColors),
      ...colors,
      primary: '#004DCE',
      primaryStrong: '#0053DB',
      success: '#007652',
      successStrong: '#007652',
      danger: '#BE003B',
      ...(!(colorScheme === 'dark')
        ? {
            background: '#FAF8FF',
            surfaceRaised: '#F3F2FF',
            primarySoft: '#DEE3FF',
            neutralSoft: '#EAEDFF',
            successSoft: '#68F6BC',
            dangerSoft: '#FFDADD',
            border: '#EFEDF6',
          }
        : {}),
    },
    gradients: {
      brand: ['#004BCC', '#326AF3'] as [string, string, ...string[]],
      background: [
        ...(colorScheme === 'dark'
          ? gradients.darkBackground
          : gradients.background),
      ] as [string, string, ...string[]],
    },
    spacing,
    radius,
    typography: { ...typography, bodySmall: 14, body: 16, title: 20 },
    motion,
    touchTarget,
    sizes: { ...componentSizes, topbar: 76, screenGutter: 20, contentMax: 487 },
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
  /**
   * Set mode used by the theme workflow.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @returns The resulting theme value for the caller.
   */
  setMode: () => undefined,
  /**
   * Toggle theme in the theme interface.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @returns The resulting theme value for the caller.
   */
  toggleTheme: () => undefined,
});

/**
 * Provide theme state and services to descendant components.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param props - The properties that configure this React component.
 * @returns The rendered app theme provider interface.
 */
export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    void keyValueStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system')
        setModeState(stored);
    });
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void keyValueStorage.setItem(THEME_KEY, nextMode);
  }, []);
  const effectiveScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const activeTheme = effectiveScheme === 'dark' ? darkTheme : lightTheme;
  const toggleTheme = useCallback(
    () => setMode(effectiveScheme === 'dark' ? 'light' : 'dark'),
    [effectiveScheme, setMode],
  );
  const value = useMemo(
    () => ({ theme: activeTheme, mode, setMode, toggleTheme }),
    [activeTheme, mode, setMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Provide app theme state and actions to React consumers.
 *
 * Use it in React components that need this shared behavior.
 * @returns The current app theme state and the actions that operate on it.
 */
export function useAppTheme() {
  return useContext(ThemeContext);
}
