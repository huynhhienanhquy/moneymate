import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './store/auth.store';
import { useThemeStore } from './store/theme.store';
import api from './services/api';

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
