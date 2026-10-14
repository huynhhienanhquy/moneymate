import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AppProvider } from '@/providers/app-provider';
import { AppThemeProvider, useAppTheme } from '@/theme';

/**
 * Apply the active theme to the root navigation container.
 *
 * Use it as an Expo Router entry point so navigation resolves the correct application screen.
 * @returns The rendered themed application interface.
 */
function ThemedApplication() {
  const { theme } = useAppTheme();
  return (
    <AppProvider>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </AppProvider>
  );
}

/**
 * Assemble the application's root providers and navigation stack.
 *
 * Use it as an Expo Router entry point so navigation resolves the correct application screen.
 * @returns The rendered root layout interface.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts({
    'BeVietnamPro-Regular': require('../../assets/fonts/BeVietnamPro-Regular.ttf'),
    'BeVietnamPro-Medium': require('../../assets/fonts/BeVietnamPro-Medium.ttf'),
    'BeVietnamPro-SemiBold': require('../../assets/fonts/BeVietnamPro-SemiBold.ttf'),
    'BeVietnamPro-Bold': require('../../assets/fonts/BeVietnamPro-Bold.ttf'),
    'BeVietnamPro-ExtraBold': require('../../assets/fonts/BeVietnamPro-ExtraBold.ttf'),
  });
  if (!loaded && !error) return null;
  return (
    <AppThemeProvider>
      <ThemedApplication />
    </AppThemeProvider>
  );
}
