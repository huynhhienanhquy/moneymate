import { NAVIGATION_ITEMS } from '@/data/navigation';

/**
 * Return navigation items required by the navigation workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param isAdmin - The is admin value required by the operation.
 * @returns The resulting navigation value for the caller.
 */
export const getNavigationItems = (isAdmin: boolean) =>
  NAVIGATION_ITEMS.filter((item) => !item.adminOnly || isAdmin);

/**
 * Determine whether route active applies.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param currentPath - The file-system location or file value used by the operation.
 * @param itemPath - The file-system location or file value used by the operation.
 * @returns `true` when the condition is satisfied; otherwise `false`.
 */
export const isRouteActive = (currentPath: string, itemPath: string) => currentPath === itemPath;

/**
 * Return current page name required by the navigation workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param currentPath - The file-system location or file value used by the operation.
 * @param isAdmin - The is admin value required by the operation.
 * @returns The resulting navigation value for the caller.
 */
export const getCurrentPageName = (currentPath: string, isAdmin: boolean) =>
  getNavigationItems(isAdmin).find((item) => isRouteActive(currentPath, item.path))?.name ?? 'MoneyMate';
