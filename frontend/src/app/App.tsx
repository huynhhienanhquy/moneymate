import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from '@/app/router/AppRoutes';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useThemeStore } from '@/shared/stores/theme.store';
import api from '@/shared/api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
