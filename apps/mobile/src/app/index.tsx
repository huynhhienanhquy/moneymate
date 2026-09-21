import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useAppTheme } from '@/theme';

export default function Index() {
  const { initialized, user } = useAuthStore();
  const { theme } = useAppTheme();
  if (!initialized) return <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}
