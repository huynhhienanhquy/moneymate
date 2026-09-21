import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import * as ScreenCapture from 'expo-screen-capture';
import Constants from 'expo-constants';
import { useRouter, useSegments } from 'expo-router';
import { setSessionExpiredHandler } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useAppTheme, type AppTheme } from '@/theme';
import { MobileChatbotProvider } from '@/components/mobile-chatbot';
import { keyValueStorage } from '@/storage/key-value';
import { OfflineProvider } from '@/providers/offline-provider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});
const queryPersister = createAsyncStoragePersister({ storage: keyValueStorage, key: 'moneymate-query-cache' });

function SessionBootstrap({ children }: PropsWithChildren) {
  const initialize = useAuthStore((state) => state.initialize);
  const expireSession = useAuthStore((state) => state.expireSession);
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [privateScreen, setPrivateScreen] = useState(false);

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await expireSession();
      queryClient.clear();
    });
    return () => setSessionExpiredHandler(null);
  }, [expireSession, queryClient]);
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync('moneymate-private-data').catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => setPrivateScreen(state !== 'active'));
    return () => {
      subscription.remove();
      ScreenCapture.allowScreenCaptureAsync('moneymate-private-data').catch(() => undefined);
    };
  }, []);

  return (
    <>
      {children}
      {privateScreen && (
        <View style={styles.privacyShield} accessibilityLabel="Nội dung tài chính đã được ẩn">
          <Text style={styles.privacyTitle}>MoneyMate</Text>
          <Text style={styles.privacyText}>Dữ liệu của bạn đang được bảo vệ</Text>
        </View>
      )}
    </>
  );
}

function NotificationNavigation() {
  const router = useRouter();
  useEffect(() => {
    if (Constants.executionEnvironment === 'storeClient') return;
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;
    void import('expo-notifications').then((Notifications) => {
      if (cancelled) return;
      const redirect = (response: import('expo-notifications').NotificationResponse | null) => {
        if (!response) return;
        const path = response.notification.request.content.data?.path;
        if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) router.push(path as never);
      };
      redirect(Notifications.getLastNotificationResponse());
      subscription = Notifications.addNotificationResponseReceivedListener(redirect);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [router]);
  return null;
}

function AuthNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const queryClient = useQueryClient();
  const { initialized, user } = useAuthStore();
  useEffect(() => {
    if (!initialized) return;
    const onAuthScreen = segments[0] === 'login' || segments[0] === 'register';
    if (!user && !onAuthScreen) {
      queryClient.clear();
      router.replace('/login');
    } else if (user && onAuthScreen) {
      router.replace('/(tabs)');
    } else if (user && (segments[0] as string) === 'admin' && user.role !== 'ADMIN') {
      router.replace('/(tabs)');
    }
  }, [initialized, queryClient, router, segments, user]);
  return null;
}

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000, buster: 'v1' }}>
      <OfflineProvider>
        <SessionBootstrap>
          <MobileChatbotProvider>
            <AuthNavigation />
            <NotificationNavigation />
            {children}
          </MobileChatbotProvider>
        </SessionBootstrap>
      </OfflineProvider>
    </PersistQueryClientProvider>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  privacyShield: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.background,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  privacyTitle: { color: theme.colors.text, fontSize: 30, fontWeight: '800' },
  privacyText: { color: theme.colors.muted, marginTop: 8 }
});
