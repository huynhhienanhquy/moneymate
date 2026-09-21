import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/providers/app-provider';
import { AppThemeProvider, useAppTheme } from '@/theme';

function ThemedApplication() {
  const { theme } = useAppTheme();
  return (
    <AppProvider>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
    </AppProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedApplication />
    </AppThemeProvider>
  );
}
