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
  <header className="dashboard-topbar sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 md:px-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
    <button onClick={onMenuOpen} aria-label="Mở menu" className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none"><Menu size={24} /></button>
    <div className="min-w-0 md:pl-1">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-500">MoneyMate</p>
      <p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100" style={{ wordSpacing: '0.22em' }}>{currentPage}</p>
    </div>
    <div className="flex items-center gap-3">
      <NotificationBell />
      <button onClick={onThemeToggle} aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} className="hidden md:flex p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-brand-500" />}
      </button>
      <div className="hidden sm:flex text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-100/70 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl">{new Date().toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
      <Link to={APP_ROUTES.profile} aria-label="Mở hồ sơ" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 text-white font-extrabold text-sm shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 transition-all">
        {user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={15} />}
      </Link>
    </div>
  </header>
);

export default Topbar;
