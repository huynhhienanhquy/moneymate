import { act } from 'react';
import '@/test/authStoreReactMock';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, cleanup } from '@/test/render';
import { useAuthStore } from '@/stores/auth.store';
import { useNotifications } from '../useNotifications';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/services/api/client', () => ({ default: { get } }));

const Harness = () => {
  useNotifications();
  return null;
};
let queryClient: QueryClient;

beforeEach(() => {
  get.mockReset().mockResolvedValue({ data: { data: { notifications: [], unreadCount: 0 } } });
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isInitializing: true });
  queryClient = new QueryClient();
});
afterEach(() => { cleanup(); queryClient.clear(); });

it('waits for session restoration before loading notifications', async () => {
  useAuthStore.setState({ isAuthenticated: true });
  render(<QueryClientProvider client={queryClient}><Harness /></QueryClientProvider>);
  expect(get).not.toHaveBeenCalled();

  await act(async () => { useAuthStore.getState().setToken('restored-token'); });
  expect(get).not.toHaveBeenCalled();
  await act(async () => { useAuthStore.getState().setInitializing(false); });
  expect(get).toHaveBeenCalledExactlyOnceWith('/notifications');
});

it('does not load notifications for a logged-out session', async () => {
  useAuthStore.setState({ isInitializing: false });
  await act(async () => { render(<QueryClientProvider client={queryClient}><Harness /></QueryClientProvider>); });
  expect(get).not.toHaveBeenCalled();
});

it('does not retry unauthorized notification requests', async () => {
  useAuthStore.setState({ isAuthenticated: true, isInitializing: false, accessToken: 'expired-token' });
  get.mockRejectedValue({ response: { status: 401 } });
  await act(async () => { render(<QueryClientProvider client={queryClient}><Harness /></QueryClientProvider>); });
  expect(queryClient.getQueryState(['notifications'])?.status).toBe('error');
  expect(get).toHaveBeenCalledOnce();
});
