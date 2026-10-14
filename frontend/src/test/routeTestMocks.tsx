export const routeAuth = { state: { user: null as null | { role: string }, isAuthenticated: false, isInitializing: false } };

vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => routeAuth.state }));
vi.mock('@/layouts/PageLayout/PageLayout', () => ({
  /**
   * Render a lightweight route placeholder for tests that do not need the real page.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @returns The resulting route test mocks value for the caller.
   */
  default: () => <div data-testid="page-layout" />,
}));
vi.mock('react-router-dom', () => ({
  /**
   * Render the navigate interface.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @param props - The properties that configure this React component.
   * @returns The rendered navigate interface.
   */
  Navigate: ({ to }: { to: string }) => <p>navigate:{to}</p>,
  /**
   * Render the outlet interface.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @returns The rendered outlet interface.
   */
  Outlet: () => <p>outlet</p>,
  /**
   * Render the routes interface.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @param props - The properties that configure this React component.
   * @returns The rendered routes interface.
   */
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  /**
   * Render the route test mocks route after enforcing its navigation requirements.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @returns The rendered route interface.
   */
  Route: () => null,
}));
