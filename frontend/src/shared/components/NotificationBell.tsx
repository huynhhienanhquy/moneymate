import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Loader2, X } from 'lucide-react';
import api from '@/shared/api/client';

const NotificationBell: React.FC = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications: any[] = data?.notifications || [];
  const unreadCount: number = data?.unreadCount || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 dark:hover:bg-slate-800 transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">Thông báo</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={() => markAllMutation.mutate()} className="text-xs text-brand-500 hover:text-brand-400">
                  Đọc tất cả
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={14} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-500" /></div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">Không có thông báo</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {notifications.map((n: any) => (
                <li key={n.id} className={`px-4 py-3 ${!n.isRead ? 'bg-brand-500/5' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-slate-200">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(n.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <button onClick={() => markReadMutation.mutate(n.id)} className="p-1 text-slate-500 hover:text-emerald-400">
                          <Check size={12} />
                        </button>
                      )}
                      <button onClick={() => deleteMutation.mutate(n.id)} className="p-1 text-slate-500 hover:text-rose-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
