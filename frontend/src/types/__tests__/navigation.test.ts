import type { NavigationItem } from '@/types/navigation';
import { Wallet } from 'lucide-react';

describe('NavigationItem', () => {
  it('supports regular and admin-only navigation entries', () => {
    const regularItem = { name: 'Ví', path: '/wallets', icon: Wallet } satisfies NavigationItem;
    const adminItem = { ...regularItem, adminOnly: true } satisfies NavigationItem;

    expect(regularItem.path).toBe('/wallets');
    expect(adminItem.adminOnly).toBe(true);
  });
});
