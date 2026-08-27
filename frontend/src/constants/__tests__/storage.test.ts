import { STORAGE_KEYS } from '@/constants/storage';

describe('STORAGE_KEYS', () => {
  it('keeps persisted user and theme keys stable', () => {
    expect(STORAGE_KEYS).toEqual({ user: 'mm_user', theme: 'mm_theme' });
  });
});
