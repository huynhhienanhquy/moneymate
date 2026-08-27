import { APP_ROUTES } from '@/constants/routes';
import { NAVIGATION_ITEMS } from '@/data/navigation';

describe('NAVIGATION_ITEMS', () => {
  it('provides a label and icon for every unique route', () => {
    const paths = NAVIGATION_ITEMS.map((item) => item.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(NAVIGATION_ITEMS.every((item) => item.name.length > 0 && typeof item.icon === 'object')).toBe(true);
  });

  it('marks only the admin route as admin-only', () => {
    expect(NAVIGATION_ITEMS.filter((item) => item.adminOnly)).toEqual([
      expect.objectContaining({ path: APP_ROUTES.admin, adminOnly: true }),
    ]);
  });
});
