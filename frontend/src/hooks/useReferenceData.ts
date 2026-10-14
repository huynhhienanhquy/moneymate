import { useQuery } from '@tanstack/react-query';
import api from '@/services/api/client';

/**
 * Provide wallets state and actions to React consumers.
 *
 * Use it in React components that need use reference data behavior.
 * @returns The current wallets state and the actions that operate on it.
 */
export const useWallets = () => useQuery({
  queryKey: ['wallets'],
  /**
   * Load use reference data data for the query cache.
   *
   * Use it in React components that need use reference data behavior.
   * @returns The resulting use reference data value for the caller.
   */
  queryFn: () => api.get('/wallets').then((response) => response.data.data),
});

/**
 * Provide categories state and actions to React consumers.
 *
 * Use it in React components that need use reference data behavior.
 * @returns The current categories state and the actions that operate on it.
 */
export const useCategories = () => useQuery({
  queryKey: ['categories'],
  /**
   * Load use reference data data for the query cache.
   *
   * Use it in React components that need use reference data behavior.
   * @returns The resulting use reference data value for the caller.
   */
  queryFn: () => api.get('/categories').then((response) => response.data.data),
});
