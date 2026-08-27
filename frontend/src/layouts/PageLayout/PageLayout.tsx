import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import api from '@/services/api/client';
import AiChatWidget from '@/components/AiChatWidget/AiChatWidget';
import { APP_ROUTES } from '@/constants/routes';
import { getCurrentPageName } from '@/helpers/navigation';
import Sidebar from '@/components/common/Sidebar/Sidebar';
import Topbar from '@/components/common/Topbar/Topbar';

export const Layout = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error logging out on backend:', err);
    } finally {
      logout();
      navigate(APP_ROUTES.login);
    }
  };

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 font-sans">
      <a href="#main-content" className="app-skip-link">Đi tới nội dung chính</a>
      <Sidebar user={user} currentPath={location.pathname} theme={theme} mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} onThemeToggle={toggleTheme} onLogout={handleLogout} />

      <div className="relative flex min-w-0 flex-1 flex-col md:ml-[206px]">
        <div className="fixed pointer-events-none overflow-hidden inset-0 z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 dark:bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 dark:bg-violet-600/5 rounded-full blur-3xl" />
        </div>

        <Topbar user={user} theme={theme} currentPage={getCurrentPageName(location.pathname, user?.role === 'ADMIN')} onMenuOpen={() => setMobileMenuOpen(true)} onThemeToggle={toggleTheme} />

        <main id="main-content" tabIndex={-1} className="relative z-10 flex-1 p-4 md:p-6 overflow-y-auto max-w-[1180px] w-full mx-auto focus:outline-none">
          <div className="animate-fade-in"><Outlet /></div>
        </main>
        <AiChatWidget />
      </div>
    </div>
  );
};

export default Layout;
