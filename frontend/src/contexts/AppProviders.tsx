import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { appQueryClient } from '@/services/queryClient';

export { appQueryClient } from '@/services/queryClient';

/**
 * Render the app providers interface.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param props - The properties that configure this React component.
 * @returns The rendered app providers interface.
 */
const AppProviders = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={appQueryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

export default AppProviders;
