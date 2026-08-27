import { APP_ROUTES } from '@/constants/routes';

describe('APP_ROUTES', () => {
  it('keeps public and protected route paths stable', () => {
    expect(APP_ROUTES).toMatchObject({
      dashboard: '/',
      login: '/login',
      register: '/register',
      transactions: '/transactions',
      profile: '/profile',
      admin: '/admin',
    });
  });

  it('contains unique paths', () => {
    const paths = Object.values(APP_ROUTES);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
