import type { UserDto } from '@moneymate/contracts';
import { Link } from 'react-router-dom';
import { LogOut, Moon, Sun, User as UserIcon, X } from 'lucide-react';
import { APP_IMAGES } from '@/assets/images';
import { getNavigationItems, isRouteActive } from '@/helpers/navigation';

type SidebarProps = {
  user: UserDto | null;
  currentPath: string;
  theme: 'dark' | 'light';
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onThemeToggle: () => void;
  onLogout: () => void;
};

const NavigationLinks = ({ user, currentPath, onNavigate, mobile = false }: Pick<SidebarProps, 'user' | 'currentPath'> & { onNavigate?: () => void; mobile?: boolean }) => (
  <nav aria-label="Điều hướng chính" className="flex-1 space-y-1 overflow-y-auto">
    {getNavigationItems(user?.role === 'ADMIN').map((item) => {
      const Icon = item.icon;
      const active = isRouteActive(currentPath, item.path);
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={mobile
            ? `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${active ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-600/20' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`
            : `flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-xs font-medium transition-all duration-200 ${active ? 'bg-[#09b9ed] text-slate-800' : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'}`}
        >
          <Icon size={mobile ? 18 : 17} />
          <span>{item.name}</span>
        </Link>
      );
    })}
  </nav>
);

const Sidebar = ({ user, currentPath, theme, mobileOpen, onMobileOpenChange, onThemeToggle, onLogout }: SidebarProps) => (
  <>
    <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-50 hidden h-dvh w-[206px] flex-col px-2.5 py-3 md:flex">
      <div className="flex items-center gap-2 px-2 py-1 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0764b8] text-xs font-black text-white">MM</div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-[#0764b8]">MoneyMate</span>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-wide uppercase">Smart Finance</p>
        </div>
      </div>

      <NavigationLinks user={user} currentPath={currentPath} />

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 p-2 pt-3">
        <button onClick={onThemeToggle} className="flex items-center justify-between w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-brand-500" />}
            <span>{theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
        </button>
        <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all">
          <LogOut size={18} /><span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    {mobileOpen && (
      <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-md">
        <aside className="w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full animate-slide-in shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={APP_IMAGES.logo} alt="" className="h-9 w-9 rounded-xl object-cover shadow-md shadow-brand-500/30" />
              <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100">MoneyMate</span>
            </div>
            <button aria-label="Đóng menu" onClick={() => onMobileOpenChange(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"><X size={20} /></button>
          </div>

          <NavigationLinks user={user} currentPath={currentPath} mobile onNavigate={() => onMobileOpenChange(false)} />

          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 text-white font-bold">{user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={16} />}</div>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold truncate text-slate-900 dark:text-slate-200">{user?.fullName}</p></div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all"><LogOut size={18} /><span>Đăng xuất</span></button>
          </div>
        </aside>
      </div>
    )}
  </>
);

export default Sidebar;
