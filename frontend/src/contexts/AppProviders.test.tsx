import { render, screen } from '@/test/render';
import AppProviders, { appQueryClient } from './AppProviders';

vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient {
    constructor(public options: unknown) {}
  },
  QueryClientProvider: ({ client, children }: { client: unknown; children: React.ReactNode }) => (
    <div data-client={client === appQueryClient ? 'configured' : 'unknown'}>{children}</div>
  ),
}));

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
}));

describe('AppProviders', () => {
  it('provides the configured query client and browser router', () => {
    render(
      <AppProviders>
        <span>provider-child</span>
      </AppProviders>,
    );

    expect(screen.getByTestId('browser-router')).toContainElement(screen.getByText('provider-child'));
    expect(screen.getByText('provider-child').parentElement?.parentElement).toHaveAttribute('data-client', 'configured');
    expect(appQueryClient).toMatchObject({
      options: { defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } },
    });
  });
});
