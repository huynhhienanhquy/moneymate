import { NAVIGATION_ITEMS } from '@/data/navigation';

export const getNavigationItems = (isAdmin: boolean) =>
  NAVIGATION_ITEMS.filter((item) => !item.adminOnly || isAdmin);

export const isRouteActive = (currentPath: string, itemPath: string) => currentPath === itemPath;

export const getCurrentPageName = (currentPath: string, isAdmin: boolean) =>
  getNavigationItems(isAdmin).find((item) => isRouteActive(currentPath, item.path))?.name ?? 'MoneyMate';
