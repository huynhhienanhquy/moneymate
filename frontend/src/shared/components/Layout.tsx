import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import api from '@/shared/api/client';
import { useThemeStore } from '@/shared/stores/theme.store';
import NotificationBell from './NotificationBell';
import AiChatWidget from './AiChatWidget';
import {
  LayoutDashboard,
  Wallet,
  Tags,
  ReceiptText,
  LogOut,
  Menu,
  X,
  TrendingUp,
  User as UserIcon,
  BarChart3,
  WalletCards,
  PiggyBank,
  Target,
  RefreshCw,
  Moon,
  Sun,
  Sparkles,
  Shield,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Ví tài khoản', path: '/wallets', icon: Wallet },
    { name: 'Giao dịch', path: '/transactions', icon: ReceiptText },
    { name: 'Danh mục', path: '/categories', icon: Tags },
    { name: 'Ngân sách', path: '/budgets', icon: PiggyBank },
    { name: 'Mục tiêu', path: '/saving-goals', icon: Target },
    { name: 'Định kỳ', path: '/recurring', icon: RefreshCw },
    { name: 'Báo cáo', path: '/reports', icon: BarChart3 },
    { name: 'Tiết kiệm tháng', path: '/monthly-balance', icon: WalletCards },
    { name: 'AI Tài chính', path: '/ai', icon: Sparkles },
    { name: 'Hồ sơ', path: '/profile', icon: UserIcon },
    ...(user?.role === 'ADMIN' ? [{ name: 'Quản trị', path: '/admin', icon: Shield }] : []),
  ];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error logging out on backend:', err);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 p-4">
        {/* Logo */}
        <div className="app-shell-card flex items-center gap-3.5 px-4 py-4 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 text-white font-extrabold text-lg shadow-lg shadow-brand-500/30">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 via-cyan-500 to-violet-500 bg-clip-text text-transparent">
              MoneyMate
            </span>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-wide uppercase">Smart Finance</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="app-shell-card flex-1 space-y-1.5 p-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-500/25 scale-[1.02]'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 hover:translate-x-1'
                }`}
              >
                <Icon size={19} className={active ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="app-shell-card mt-4 flex flex-col gap-3 p-3">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-brand-500" />}
              <span>{theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold">
              {theme === 'dark' ? 'DARK' : 'LIGHT'}
            </span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-cyan-400 text-white font-extrabold shadow-md shadow-brand-500/20">
              {user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">
                {user?.fullName}
              </p>
              <p className="text-xs truncate text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-md">
          <aside className="w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full animate-slide-in shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white font-bold shadow-md shadow-brand-500/30">
                  <TrendingUp size={18} />
                </div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100">MoneyMate</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-600/20'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 text-white font-bold">
                  {user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-200">{user?.fullName}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Decorative background blobs */}
        <div className="fixed pointer-events-none overflow-hidden inset-0 z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 dark:bg-brand-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 dark:bg-violet-600/5 rounded-full blur-3xl"></div>
        </div>

        {/* Header - Mobile & Desktop Profile Bar */}
        <header className="sticky top-0 z-40 mx-4 mt-4 flex h-16 items-center justify-between md:justify-end rounded-3xl border border-white/80 bg-white/75 px-5 shadow-lg shadow-brand-500/5 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/75 dark:shadow-black/20">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-brand-500" />}
            </button>
            <div className="hidden sm:flex text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-100/70 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' })}
            </div>
            
            {/* Profile Avatar Badge */}
            <Link
              to="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 text-white font-extrabold text-sm shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 transition-all"
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={15} />}
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="relative z-10 flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <AiChatWidget />
      </div>
    </div>
  );
};

export default Layout;
