import React from 'react';
import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '../src/styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    controls: { expanded: true },
    a11y: { test: 'todo' },
    backgrounds: { default: 'light' },
  },
  tags: ['autodocs'],
};

export default preview;
