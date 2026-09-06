import { act, StrictMode, type PropsWithChildren } from 'react';
import '@/test/authStoreReactMock';
import { render, screen } from '@/test/render';
import { fireEvent } from '@testing-library/dom';
import { useAuthStore } from '@/stores/auth.store';
import App from './App';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('axios', () => ({ default: {
  post,
  create: () => ({ interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }),
} }));
vi.mock('@/contexts/AppProviders', () => ({ default: ({ children }: PropsWithChildren) => children }));
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>navigate:{to}</div>,
  Outlet: () => <div>protected-content</div>,
}));
vi.mock('@/config/route/AppRoutes', async () => ({ default: (await import('@/config/route/PrivateRoute')).default }));
vi.mock('@/stores/theme.store', () => ({ useThemeStore: () => ({ initTheme: () => {} }) }));

beforeEach(() => {
  post.mockReset();
  localStorage.clear();
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isInitializing: true });
});

it('refreshes a cached session only once under StrictMode', async () => {
  useAuthStore.setState({ isAuthenticated: true });
  let finish!: (value: unknown) => void;
  post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<StrictMode><App /></StrictMode>);
  expect(post).toHaveBeenCalledOnce();
  expect(useAuthStore.getState().isInitializing).toBe(true);
  expect(screen.queryByText('navigate:/login')).not.toBeInTheDocument();

  await act(async () => finish({ data: { data: { accessToken: 'restored-token' } } }));

  expect(useAuthStore.getState()).toMatchObject({ accessToken: 'restored-token', isAuthenticated: true, isInitializing: false });
  expect(post).toHaveBeenCalledOnce();
  expect(screen.getByText('protected-content')).toBeInTheDocument();
});

it('does not refresh again after a successful login', async () => {
  render(<StrictMode><App /></StrictMode>);
  await act(async () => {
    useAuthStore.getState().login({ id: 'user-1' } as never, 'login-token');
  });
  expect(post).not.toHaveBeenCalled();
  expect(useAuthStore.getState().accessToken).toBe('login-token');
});

it('clears an expired cached session when refresh is rejected', async () => {
  useAuthStore.setState({ isAuthenticated: true });
  post.mockRejectedValue({ response: { status: 401 } });
  await act(async () => { render(<StrictMode><App /></StrictMode>); });
  expect(post).toHaveBeenCalledOnce();
  expect(useAuthStore.getState()).toMatchObject({ accessToken: null, isAuthenticated: false, isInitializing: false });
  expect(screen.getByText('navigate:/login')).toBeInTheDocument();
});

it.each([undefined, 503])('keeps the cached login during a temporary reload failure (%s) and allows retry', async (status) => {
  useAuthStore.getState().setUser({ id: 'user-1', role: 'USER' } as never);
  useAuthStore.setState({ isAuthenticated: true });
  post.mockRejectedValueOnce({ response: status ? { status } : undefined });
  await act(async () => { render(<StrictMode><App /></StrictMode>); });

  expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, isInitializing: true });
  expect(localStorage.getItem('mm_user')).toContain('user-1');
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByText('navigate:/login')).not.toBeInTheDocument();

  post.mockResolvedValueOnce({ data: { data: { accessToken: 'restored-token' } } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })); });

  expect(post).toHaveBeenCalledTimes(2);
  expect(useAuthStore.getState()).toMatchObject({ accessToken: 'restored-token', isInitializing: false });
  expect(screen.getByText('protected-content')).toBeInTheDocument();
});
