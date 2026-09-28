import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { appQueryClient } from '@/services/queryClient';

export { appQueryClient } from '@/services/queryClient';

const AppProviders = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={appQueryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

export default AppProviders;
