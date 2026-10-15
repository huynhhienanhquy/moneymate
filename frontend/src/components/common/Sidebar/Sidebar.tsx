import { useEffect, useRef } from 'react';
import type { UserDto } from '@moneymate/contracts';
import { Link } from 'react-router-dom';
import { ChevronRight, LogOut, Moon, Sparkles, Sun, X } from 'lucide-react';
import { APP_IMAGES } from '@/assets/images';
import { APP_ROUTES } from '@/constants/routes';
import { getNavigationItems, isRouteActive } from '@/helpers/navigation';
import { useAnimatedPresence } from '@/hooks/useAnimatedPresence';

type SidebarProps = {
  user: UserDto | null;
  currentPath: string;
  theme: 'dark' | 'light';
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onThemeToggle: () => void;
  onLogout: () => void;
};

const groups: { label: string; paths: string[] }[] = [
  { label: 'Tổng quan', paths: [APP_ROUTES.dashboard, APP_ROUTES.wallets, APP_ROUTES.transactions, APP_ROUTES.categories] },
  { label: 'Kế hoạch tài chính', paths: [APP_ROUTES.budgets, APP_ROUTES.savingGoals, APP_ROUTES.recurring, APP_ROUTES.reports, APP_ROUTES.monthlyBalance] },
  { label: 'Tiện ích', paths: [APP_ROUTES.aiAdvisor, APP_ROUTES.profile, APP_ROUTES.admin] },
];

const NavigationLinks = ({ user, currentPath, onNavigate }: Pick<SidebarProps, 'user' | 'currentPath'> & { onNavigate?: () => void }) => (
  <nav aria-label="Điều hướng chính" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
    {groups.map((group) => (
      <div key={group.label}>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{group.label}</p>
        <div className="space-y-1">
          {getNavigationItems(user?.role === 'ADMIN').filter((item) => group.paths.includes(item.path)).map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(currentPath, item.path);
            return (
              <Link key={item.path} to={item.path} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                className={`sidebar-link group flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}>
                <Icon aria-hidden="true" className={`size-[18px] shrink-0 ${active ? 'text-blue-600 dark:text-blue-300' : ''}`} strokeWidth={active ? 2.2 : 1.8} />
                <span className="min-w-0 flex-1">{item.name}</span>
                {item.path === APP_ROUTES.aiAdvisor && <span aria-hidden="true" className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">AI</span>}
                {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-blue-600 dark:bg-blue-300" />}
              </Link>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

const Sidebar = ({ user, currentPath, theme, mobileOpen, onMobileOpenChange, onThemeToggle, onLogout }: SidebarProps) => {
  const drawerRef = useRef<HTMLElement>(null);
  const { isPresent, motionState } = useAnimatedPresence(mobileOpen);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileOpenChange(false);
      if (event.key !== 'Tab') return;
      const items = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const handleResize = () => { if (window.innerWidth >= 768) onMobileOpenChange(false); };
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
      previousFocus?.focus();
    };
  }, [mobileOpen, onMobileOpenChange]);

  const brand = (
    <div className="flex items-center gap-3">
      <img src={APP_IMAGES.logo} alt="" className="size-10 rounded-xl object-cover" />
      <div><span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">MoneyMate<span className="text-blue-600">.</span></span>
        <p className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-400">Tài chính trong tầm tay</p></div>
    </div>
  );
  const controls = (
    <div className="border-t border-ui-border p-3">
      <button onClick={onThemeToggle} className="sidebar-control">
        {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        <span>{theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</span>
      </button>
      <button onClick={onLogout} className="sidebar-control text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><LogOut className="size-[18px]" /><span>Đăng xuất</span></button>
    </div>
  );

  return <>
    <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-50 hidden h-dvh w-sidebar flex-col border-r border-ui-border bg-ui-surface md:flex">
      <div className="px-6 pb-8 pt-7">{brand}</div>
      <NavigationLinks user={user} currentPath={currentPath} />
      <Link to={APP_ROUTES.aiAdvisor} className="mx-4 mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 transition-colors hover:bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 dark:hover:bg-blue-500/10">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300"><Sparkles className="size-4" /> Trợ lý tài chính AI</div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Hiểu chi tiêu, chủ động hơn với từng kế hoạch.</p>
        <span className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300">Khám phá ngay <ChevronRight className="size-3" /></span>
      </Link>
      {controls}
    </aside>
    {isPresent && <div data-state={motionState} aria-hidden={!mobileOpen || undefined} {...(!mobileOpen ? { inert: '' } : {})} className="app-drawer-backdrop fixed inset-0 z-overlay flex bg-slate-950/50 backdrop-blur-sm md:hidden" onMouseDown={(event) => { if (mobileOpen && event.target === event.currentTarget) onMobileOpenChange(false); }}>
      <aside ref={drawerRef} data-state={motionState} role="dialog" aria-modal="true" aria-label="Menu điều hướng" className="app-drawer flex h-dvh w-[min(300px,85vw)] flex-col border-r border-ui-border bg-ui-surface shadow-2xl">
        <div className="flex items-center justify-between px-5 py-6">{brand}<button aria-label="Đóng menu" onClick={() => onMobileOpenChange(false)} className="app-icon-button"><X className="size-5" /></button></div>
        <NavigationLinks user={user} currentPath={currentPath} onNavigate={() => onMobileOpenChange(false)} />
        {controls}
      </aside>
    </div>}
  </>;
};

export default Sidebar;
