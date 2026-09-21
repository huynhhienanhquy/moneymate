import { useCallback, useEffect, useRef, type PropsWithChildren } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { apiRequest } from '@/lib/api';
import {
  applyTransactionDelta,
  getPendingMutations,
  getSyncCursor,
  markMutationFailed,
  markMutationSynced,
  migrateDatabase,
  type TransactionDelta,
} from '@/storage/database';
import { useAuthStore } from '@/stores/auth.store';

function OutboxSync() {
  const database = useSQLiteContext();
  const user = useAuthStore((state) => state.user);
  const syncing = useRef(false);

  const sync = useCallback(async () => {
    if (!user || syncing.current) return;
    syncing.current = true;
    try {
      const items = await getPendingMutations(database, user.id);
      for (const item of items) {
        try {
          await apiRequest(item.path, {
            method: item.method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            headers: { 'Idempotency-Key': item.id },
            body: item.body,
          });
          await markMutationSynced(database, user.id, item.id);
        } catch (error) {
          await markMutationFailed(database, user.id, item.id, error instanceof Error ? error.message : 'Sync failed', item.attempts);
        }
      }
      let cursor = await getSyncCursor(database, user.id);
      for (let page = 0; page < 10; page += 1) {
        const query = cursor ? `?cursor=${encodeURIComponent(cursor)}&take=100` : '?take=100';
        const delta = await apiRequest<{ items: TransactionDelta[]; nextCursor: string | null; hasMore: boolean }>(`/transactions/sync${query}`);
        await applyTransactionDelta(database, user.id, delta.items, delta.nextCursor);
        cursor = delta.nextCursor || cursor;
        if (!delta.hasMore) break;
      }
    } catch (error) {
      console.warn('MoneyMate background sync failed', error);
    } finally {
      syncing.current = false;
    }
  }, [database, user]);

  useEffect(() => NetInfo.addEventListener((network) => {
    if (network.isConnected) void sync();
  }), [sync]);
  return null;
}

export function OfflineProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="moneymate.db" onInit={migrateDatabase}>
      <OutboxSync />
      {children}
    </SQLiteProvider>
  );
}
