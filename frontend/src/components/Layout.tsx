import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import { useThemeStore } from '../store/theme.store';
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg shadow-md shadow-brand-500/20">
            <TrendingUp size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            MoneyMate
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 font-semibold border border-slate-700">
              {user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">
                {user?.fullName}
              </p>
              <p className="text-xs truncate text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/5 hover:text-rose-300 transition-all border border-transparent hover:border-rose-500/10"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col h-full animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
                  <TrendingUp size={16} />
                </div>
                <span className="font-extrabold text-lg text-slate-200">MoneyMate</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 font-semibold">
                  {user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-slate-200">{user?.fullName}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/5 transition-all"
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Mobile & Desktop Profile Bar */}
        <header className="flex h-16 items-center justify-between md:justify-end px-6 bg-white/80 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-40">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-200 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden sm:flex text-gray-500 dark:text-slate-500 text-sm font-medium">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            
            {/* Profile Avatar Badge */}
            <Link
              to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/10 border border-brand-500/20 text-brand-400 font-bold text-sm hover:bg-brand-600/20 transition"
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : <UserIcon size={14} />}
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        <AiChatWidget />
      </div>
    </div>
  );
};

export default Layout;
