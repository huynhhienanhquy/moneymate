import React, { useEffect, useState } from 'react';
import AppRoutes from '@/config/route/AppRoutes';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { refreshAccessToken } from '@/services/api/client';
import AppProviders from '@/contexts/AppProviders';

const AppInit: React.FC = () => {
  const { isAuthenticated, isInitializing, accessToken, setInitializing } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [restoreError, setRestoreError] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (!isInitializing) return;

    if (isAuthenticated && !accessToken) {
      let cancelled = false;
      void refreshAccessToken()
        .then(() => {
          if (!cancelled) setInitializing(false);
        })
        .catch(() => {
          if (!cancelled && useAuthStore.getState().isAuthenticated) setRestoreError(true);
        });
      return () => { cancelled = true; };
    } else {
      setInitializing(false);
    }
  }, [isAuthenticated, isInitializing, accessToken, setInitializing, restoreAttempt]);

  if (isInitializing && restoreError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
        <p className="font-bold">Chưa thể khôi phục phiên đăng nhập</p>
        <p>Không thể kết nối máy chủ. Vui lòng thử lại.</p>
        <button className="app-primary-button" onClick={() => {
          setRestoreError(false);
          setRestoreAttempt((attempt) => attempt + 1);
        }}>Thử lại</button>
      </div>
    );
  }

  return <AppRoutes />;
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppInit />
    </AppProviders>
  );
};

export default App;
