import React, { useEffect } from 'react';
import AppRoutes from '@/config/route/AppRoutes';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import api from '@/services/api/client';
import AppProviders from '@/contexts/AppProviders';

const AppInit: React.FC = () => {
  const { isAuthenticated, setToken, logout, setInitializing } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (isAuthenticated) {
      api.post('/auth/refresh')
        .then((res) => {
          const { accessToken } = res.data.data;
          setToken(accessToken);
          setInitializing(false);
        })
        .catch(() => {
          logout();
          setInitializing(false);
        });
    } else {
      setInitializing(false);
    }
  }, [isAuthenticated]);

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
