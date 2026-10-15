import { lazy, Suspense, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import api, { runAuthSessionTransition } from '@/services/api/client';
import AiChatWidget from '@/components/AiChatWidget/AiChatWidget';
import { COPILOTKIT_FRONTEND_ENABLED } from '@/config/copilotkit';
import { APP_ROUTES } from '@/constants/routes';
import { getCurrentPageName } from '@/helpers/navigation';
import Sidebar from '@/components/common/Sidebar/Sidebar';
import Topbar from '@/components/common/Topbar/Topbar';
import { appQueryClient } from '@/services/queryClient';

const MoneyMateCopilotFeature = lazy(() => import('@/components/MoneyMateCopilot/MoneyMateCopilotFeature'));

/**
 * Render the page layout content interface.
 *
 * Use it to keep the page layout workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered page layout content interface.
 */
export const PageLayoutContent = ({ assistant = null }: { assistant?: ReactNode }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Handle logout for the page layout workflow.
   *
   * Use it to keep the page layout workflow's presentation and interactions in one reusable UI boundary.
   * @returns A promise that resolves after the operation completes.
   */
  const handleLogout = async () => {
    try {
      await runAuthSessionTransition(() => api.post('/auth/logout'));
    } catch (err) {
      console.error('Error logging out on backend:', err);
    } finally {
      logout();
      appQueryClient.clear();
      navigate(APP_ROUTES.login);
    }
  };

  return (
    <div className="app-layout min-h-screen bg-ui-raised font-sans text-ui-text">
      <a href="#main-content" className="app-skip-link">Đi tới nội dung chính</a>
      <Sidebar user={user} currentPath={location.pathname} theme={theme} mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} onThemeToggle={toggleTheme} onLogout={handleLogout} />

      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col md:ml-sidebar">
        <Topbar user={user} theme={theme} currentPage={getCurrentPageName(location.pathname, user?.role === 'ADMIN')} onMenuOpen={() => setMobileMenuOpen(true)} onThemeToggle={toggleTheme} />

        <main id="main-content" tabIndex={-1} className="relative mx-auto w-full min-w-0 max-w-content flex-1 px-4 py-6 pb-24 focus:outline-none sm:px-6 md:px-8 md:py-8 md:pb-24 xl:px-10">
          <div key={location.pathname} className="app-route-enter"><Outlet /></div>
        </main>
        {assistant}
      </div>
    </div>
  );
};

/**
 * Render the layout interface.
 *
 * Use it to keep the page layout workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered layout interface.
 */
export const Layout = () => {
  if (!COPILOTKIT_FRONTEND_ENABLED) {
    return <PageLayoutContent assistant={<AiChatWidget />} />;
  }

  return (
    <Suspense fallback={<PageLayoutContent />}>
      <MoneyMateCopilotFeature />
    </Suspense>
  );
};

export default Layout;
