import type { UserDto } from '@moneymate/contracts';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronDown, Menu, Moon, Sun, User as UserIcon } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell/NotificationBell';
import { APP_ROUTES } from '@/constants/routes';

type TopbarProps = {
  user: UserDto | null;
  theme: 'dark' | 'light';
  currentPage: string;
  onMenuOpen: () => void;
  onThemeToggle: () => void;
};

/**
 * Render the topbar interface.
 *
 * Use it to keep the topbar workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered topbar interface.
 */
const Topbar = ({ user, theme, currentPage, onMenuOpen, onThemeToggle }: TopbarProps) => (
  <header className="dashboard-topbar sticky top-0 z-40 flex h-[76px] items-center justify-between gap-2 border-b border-ui-border bg-ui-surface/95 px-4 backdrop-blur-xl md:px-8 xl:px-10">
    <button onClick={onMenuOpen} aria-label="Mở menu" aria-haspopup="dialog" className="app-icon-button md:hidden"><Menu className="size-5" /></button>
    <div className="min-w-0 md:pl-1">
      <p className="truncate text-xs font-medium text-ui-muted"><span className="hidden lg:inline">Không gian cá nhân<span className="mx-3 text-slate-300 dark:text-slate-600">/</span></span><strong className="font-semibold text-ui-text">{currentPage}</strong></p>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="mr-2 hidden items-center gap-2 text-xs font-medium text-ui-muted xl:flex">
        <CalendarDays aria-hidden="true" className="size-4" />{new Date().toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      <button onClick={onThemeToggle} aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} className="app-icon-button">
        {theme === 'dark' ? <Sun  className="size-4.5 text-amber-400" /> : <Moon  className="size-4.5 text-brand-500" />}
      </button>
      <NotificationBell />
      <Link to={APP_ROUTES.profile} aria-label="Mở hồ sơ" className="ml-1 flex min-h-11 items-center gap-2.5 rounded-xl border-l border-ui-border py-1 pl-3 pr-1 transition hover:bg-slate-50 dark:hover:bg-slate-800 sm:pl-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-extrabold text-white shadow-sm">{user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="size-icon-small" />}</span>
        <span className="hidden min-w-0 text-left lg:block"><strong className="block max-w-32 truncate text-xs font-bold text-ui-text">{user?.fullName || 'Người dùng'}</strong><small className="mt-0.5 block text-[10px] text-ui-muted">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Tài khoản cá nhân'}</small></span>
        <ChevronDown aria-hidden="true" className="hidden size-3.5 text-ui-muted lg:block" />
      </Link>
    </div>
  </header>
);

export default Topbar;
