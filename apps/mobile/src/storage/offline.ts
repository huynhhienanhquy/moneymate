import { useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { enqueueMutation, getFailedMutationCount, type OutboxItem } from '@/storage/database';

export function useOfflineStorage() {
  const database = useSQLiteContext();
  return useMemo(() => ({
    enqueue: (userId: string, item: Omit<OutboxItem, 'attempts'>) => enqueueMutation(database, userId, item),
    getFailedCount: (userId: string) => getFailedMutationCount(database, userId),
  }), [database]);
}
