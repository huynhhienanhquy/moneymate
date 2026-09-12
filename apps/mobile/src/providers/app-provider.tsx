import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import NetInfo from '@react-native-community/netinfo';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import Storage from 'expo-sqlite/kv-store';
import * as ScreenCapture from 'expo-screen-capture';
import Constants from 'expo-constants';
import { useRouter, useSegments } from 'expo-router';
import { apiRequest, setSessionExpiredHandler } from '@/lib/api';
import { applyTransactionDelta, getPendingMutations, getSyncCursor, markMutationFailed, markMutationSynced, migrateDatabase, type TransactionDelta } from '@/storage/database';
import { useAuthStore } from '@/stores/auth.store';
import { theme } from '@/theme';
import { MobileChatbotProvider } from '@/components/mobile-chatbot';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});
const queryPersister = createAsyncStoragePersister({ storage: Storage, key: 'moneymate-query-cache' });

function SessionBootstrap({ children }: PropsWithChildren) {
  const initialize = useAuthStore((state) => state.initialize);
  const expireSession = useAuthStore((state) => state.expireSession);
  const queryClient = useQueryClient();
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
    let subscription: { remove: () => void } | null = null;
    try {
      const Notifications = require('expo-notifications');
      subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const path = response.notification.request.content.data?.path;
        if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) router.push(path as never);
      });
    } catch {
      // expo-notifications not available
    }
    return () => subscription?.remove();
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
    }
  }, [initialized, queryClient, router, segments, user]);
  return null;
}

function OutboxSync() {
  const db = useSQLiteContext();
  const user = useAuthStore((state) => state.user);
  const syncing = useRef(false);

  const sync = useCallback(async () => {
    if (!user || syncing.current) return;
    syncing.current = true;
    try {
      const items = await getPendingMutations(db, user.id);
      for (const item of items) {
        try {
          await apiRequest(item.path, {
            method: item.method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            headers: { 'Idempotency-Key': item.id },
            body: item.body
          });
          await markMutationSynced(db, user.id, item.id);
        } catch (error) {
          await markMutationFailed(db, user.id, item.id, error instanceof Error ? error.message : 'Sync failed', item.attempts);
        }
      }
      let cursor = await getSyncCursor(db, user.id);
      for (let page = 0; page < 10; page++) {
        const query = cursor ? `?cursor=${encodeURIComponent(cursor)}&take=100` : '?take=100';
        const delta = await apiRequest<{ items: TransactionDelta[]; nextCursor: string | null; hasMore: boolean }>(`/transactions/sync${query}`);
        await applyTransactionDelta(db, user.id, delta.items, delta.nextCursor);
        cursor = delta.nextCursor || cursor;
        if (!delta.hasMore) break;
      }
    } catch (error) {
      // Network and SQLite failures are retried on the next connectivity event;
      // never let an event-listener promise become an unhandled rejection.
      console.warn('MoneyMate background sync failed', error);
    } finally {
      syncing.current = false;
    }
  }, [db, user]);

  useEffect(() => NetInfo.addEventListener((network) => {
    if (network.isConnected) void sync();
  }), [sync]);
  return null;
}

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000, buster: 'v1' }}>
      <SQLiteProvider databaseName="moneymate.db" onInit={migrateDatabase}>
        <SessionBootstrap>
          <MobileChatbotProvider>
            <OutboxSync />
            <AuthNavigation />
            <NotificationNavigation />
            {children}
          </MobileChatbotProvider>
        </SessionBootstrap>
      </SQLiteProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
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
