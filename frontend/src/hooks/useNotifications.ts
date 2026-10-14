import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Provide notifications state and actions to React consumers.
 *
 * Use it in React components that need use notifications behavior.
 * @returns The current notifications state and the actions that operate on it.
 */
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryKey = ['notifications'];
  const canFetch = useAuthStore((state) => state.isAuthenticated && !state.isInitializing && !!state.accessToken);

  const { data, isLoading } = useQuery({
    queryKey,
    /**
     * Load use notifications data for the query cache.
     *
     * Use it in React components that need use notifications behavior.
     * @returns The resulting use notifications value for the caller.
     */
    queryFn: () => api.get('/notifications').then((response) => response.data.data),
    enabled: canFetch,
    refetchInterval: canFetch ? 60_000 : false,
    /**
     * Retry for use notifications.
     *
     * Use it in React components that need use notifications behavior.
     * @param failureCount - The failure count value required by the operation.
     * @param error - The failure value to classify, report, or propagate.
     * @returns The resulting use notifications value for the caller.
     */
    retry: (failureCount, error) => ![401, 403].includes((error as { response?: { status?: number } }).response?.status ?? 0) && failureCount < 1,
  });
  /**
   * Invalidate for use notifications.
   *
   * Use it in React components that need use notifications behavior.
   * @returns The resulting use notifications value for the caller.
   */
  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const markRead = useMutation({ mutationFn: (id: string) => api.patch(`/notifications/${id}/read`), onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: () => api.patch('/notifications/read-all'), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/notifications/${id}`), onSuccess: invalidate });

  useEffect(() => {
    /**
     * Close on outside click in the use notifications interface.
     *
     * Use it in React components that need use notifications behavior.
     * @param event - The UI or runtime event that initiated the operation.
     * @returns Nothing; the operation is complete when the function returns.
     */
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return {
    open,
    setOpen,
    containerRef,
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    /**
     * Mark read for use notifications.
     *
     * Use it in React components that need use notifications behavior.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting use notifications value for the caller.
     */
    markRead: (id: string) => markRead.mutate(id),
    /**
     * Mark all read for use notifications.
     *
     * Use it in React components that need use notifications behavior.
     * @returns The resulting use notifications value for the caller.
     */
    markAllRead: () => markAllRead.mutate(),
    /**
     * Remove use notifications from the use notifications workflow.
     *
     * Use it in React components that need use notifications behavior.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting use notifications value for the caller.
     */
    remove: (id: string) => remove.mutate(id),
  };
};
