import type { OutboxItem } from '@/storage/database';

const webOfflineStorage = {
  /**
   * Enqueue for offline.web.
   *
   * Use it when offline.web data must be read from or written to local persistence.
   * @param _userId - The identifier of the user whose data is being processed.
   * @param _item - The item value required by the operation.
   * @returns A promise that resolves after the operation completes.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  enqueue: async (_userId: string, _item: Omit<OutboxItem, 'attempts'>) => {
    throw new Error(
      'Hàng đợi ngoại tuyến chỉ khả dụng trên ứng dụng iOS và Android.',
    );
  },
  /**
   * Return failed count required by the offline.web workflow.
   *
   * Use it when offline.web data must be read from or written to local persistence.
   * @param _userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting offline.web value.
   */
  getFailedCount: async (_userId: string) => 0,
};

/**
 * Provide offline storage state and actions to React consumers.
 *
 * Use it when offline.web data must be read from or written to local persistence.
 * @returns The current offline storage state and the actions that operate on it.
 */
export function useOfflineStorage() {
  return webOfflineStorage;
}
