export const routeAuth = { state: { user: null as null | { role: string }, isAuthenticated: false, isInitializing: false } };

vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => routeAuth.state }));
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <p>navigate:{to}</p>,
  Outlet: () => <p>outlet</p>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: () => null,
}));
