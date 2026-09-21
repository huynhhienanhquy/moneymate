import type { OutboxItem } from '@/storage/database';

const webOfflineStorage = {
  enqueue: async (_userId: string, _item: Omit<OutboxItem, 'attempts'>) => {
    throw new Error('Hàng đợi ngoại tuyến chỉ khả dụng trên ứng dụng iOS và Android.');
  },
  getFailedCount: async (_userId: string) => 0,
};

export function useOfflineStorage() {
  return webOfflineStorage;
}
