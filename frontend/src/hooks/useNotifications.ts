import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryKey = ['notifications'];
  const canFetch = useAuthStore((state) => state.isAuthenticated && !state.isInitializing && !!state.accessToken);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get('/notifications').then((response) => response.data.data),
    enabled: canFetch,
    refetchInterval: canFetch ? 60_000 : false,
    retry: (failureCount, error) => ![401, 403].includes((error as { response?: { status?: number } }).response?.status ?? 0) && failureCount < 1,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const markRead = useMutation({ mutationFn: (id: string) => api.patch(`/notifications/${id}/read`), onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: () => api.patch('/notifications/read-all'), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/notifications/${id}`), onSuccess: invalidate });

  useEffect(() => {
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
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    remove: (id: string) => remove.mutate(id),
  };
};
