import { useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  enqueueMutation,
  getFailedMutationCount,
  type OutboxItem,
} from '@/storage/database';

/**
 * Provide offline storage state and actions to React consumers.
 *
 * Use it when offline data must be read from or written to local persistence.
 * @returns The current offline storage state and the actions that operate on it.
 */
export function useOfflineStorage() {
  const database = useSQLiteContext();
  return useMemo(
    () => ({
      /**
       * Enqueue for offline.
       *
       * Use it when offline data must be read from or written to local persistence.
       * @param userId - The identifier of the user whose data is being processed.
       * @param item - The item value required by the operation.
       * @returns The resulting offline value for the caller.
       */
      enqueue: (userId: string, item: Omit<OutboxItem, 'attempts'>) =>
        enqueueMutation(database, userId, item),
      /**
       * Return failed count required by the offline workflow.
       *
       * Use it when offline data must be read from or written to local persistence.
       * @param userId - The identifier of the user whose data is being processed.
       * @returns The resulting offline value for the caller.
       */
      getFailedCount: (userId: string) =>
        getFailedMutationCount(database, userId),
    }),
    [database],
  );
}
