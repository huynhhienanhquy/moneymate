import { APP_ROUTES } from '@/constants/routes';
import { getCurrentPageName, getNavigationItems, isRouteActive } from '@/helpers/navigation';

describe('navigation helpers', () => {
  it('only exposes the admin entry to administrators', () => {
    expect(getNavigationItems(false).some((item) => item.path === APP_ROUTES.admin)).toBe(false);
    expect(getNavigationItems(true).some((item) => item.path === APP_ROUTES.admin)).toBe(true);
  });

  it('resolves active routes and their page names', () => {
    expect(isRouteActive(APP_ROUTES.wallets, APP_ROUTES.wallets)).toBe(true);
    expect(getCurrentPageName(APP_ROUTES.wallets, false)).toBe('Ví tài khoản');
    expect(getCurrentPageName('/unknown', false)).toBe('MoneyMate');
  });
});
