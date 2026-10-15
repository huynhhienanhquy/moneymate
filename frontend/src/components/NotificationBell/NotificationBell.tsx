import AppButton from '@/components/common/AppButton/AppButton';
import AppTitle from '@/components/common/AppTitle/AppTitle';
import React from 'react';
import { Bell, Check, Trash2, Loader2, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAnimatedPresence } from '@/hooks/useAnimatedPresence';

/**
 * Render the notification bell interface.
 *
 * Use it to keep the notification bell workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered notification bell interface.
 */
const NotificationBell: React.FC = () => {
  const { open, setOpen, containerRef, notifications, unreadCount, isLoading, markRead, markAllRead, remove } = useNotifications();
  const { isPresent, motionState } = useAnimatedPresence(open);

  return (
    <div className="relative" ref={containerRef}>
      <AppButton unstyled
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        aria-controls={open ? 'notifications-panel' : undefined}
        onClick={() => setOpen(!open)}
        className="app-icon-button relative"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-badge font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </AppButton>

      {isPresent && (
        <div id="notifications-panel" data-state={motionState} aria-hidden={!open || undefined} {...(!open ? { inert: '' } : {})} className="app-popover fixed inset-x-4 top-[68px] z-50 max-h-[min(24rem,70dvh)] overflow-y-auto rounded-2xl border border-ui-border bg-ui-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800">
            <AppTitle unstyled level={3} className="text-sm font-semibold text-gray-900 dark:text-slate-200">Thông báo</AppTitle>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <AppButton unstyled onClick={markAllRead} className="text-xs text-brand-500 hover:text-brand-400">
                  Đọc tất cả
                </AppButton>
              )}
              <AppButton unstyled aria-label="Đóng thông báo" onClick={() => setOpen(false)} className="app-icon-button min-h-8 min-w-8">
                <X className="size-3.5" />
              </AppButton>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2  className="size-5 animate-spin text-brand-500" /></div>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-ui-muted">Không có thông báo</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {notifications.map((n: any) => (
                <li key={n.id} className={`px-4 py-3 ${!n.isRead ? 'bg-brand-500/5' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-slate-200">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-badge text-slate-500 mt-1">
                        {new Date(n.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <AppButton unstyled aria-label={`Đánh dấu đã đọc: ${n.title}`} onClick={() => markRead(n.id)} className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10">
                          <Check className="size-3" />
                        </AppButton>
                      )}
                      <AppButton unstyled aria-label={`Xóa thông báo: ${n.title}`} onClick={() => remove(n.id)} className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                        <Trash2 className="size-3" />
                      </AppButton>
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
