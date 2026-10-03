import type { UserDto } from '@moneymate/contracts';
import { Link } from 'react-router-dom';
import { Menu, Moon, Sun, User as UserIcon } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell/NotificationBell';
import { APP_ROUTES } from '@/constants/routes';

type TopbarProps = {
  user: UserDto | null;
  theme: 'dark' | 'light';
  currentPage: string;
  onMenuOpen: () => void;
  onThemeToggle: () => void;
};

const Topbar = ({ user, theme, currentPage, onMenuOpen, onThemeToggle }: TopbarProps) => (
  <header className="dashboard-topbar sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 md:px-8">
    <button onClick={onMenuOpen} aria-label="Mở menu" className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none"><Menu className="size-6" /></button>
    <div className="min-w-0 md:pl-1">
      <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400"><span className="hidden sm:inline">Hệ thống&nbsp;&nbsp;/&nbsp;&nbsp;</span><strong className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</strong></p>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 sm:flex dark:bg-slate-800 dark:text-slate-300">
        <span aria-hidden="true">▣</span>{new Date().toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' })}
      </div>
      <button onClick={onThemeToggle} aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} className="hidden md:flex p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        {theme === 'dark' ? <Sun  className="size-4.5 text-amber-400" /> : <Moon  className="size-4.5 text-brand-500" />}
      </button>
      <NotificationBell />
      <Link to={APP_ROUTES.profile} aria-label="Mở hồ sơ" className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-50 dark:hover:bg-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-extrabold text-white shadow-sm">{user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="size-icon-small" />}</span>
        <span className="hidden min-w-0 text-left lg:block"><strong className="block max-w-32 truncate text-body-small font-bold text-slate-900 dark:text-white">{user?.fullName || 'Người dùng'}</strong><small className="block text-caption text-slate-500">Premium Plan</small></span>
      </Link>
    </div>
  </header>
);

export default Topbar;
