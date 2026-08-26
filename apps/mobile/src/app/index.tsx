import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { theme } from '@/theme';

export default function Index() {
  const { initialized, user } = useAuthStore();
  if (!initialized) return <View style={styles.loading}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' } });
