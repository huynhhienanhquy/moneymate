import { useAuthStore } from '../auth.store';

const user = { id: 'user-1', email: 'user@moneymate.vn', fullName: 'Money Mate', role: 'USER' } as never;

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isInitializing: true });
  });

  it('logs in, updates and logs out', () => {
    useAuthStore.getState().login(user, 'token');
    expect(useAuthStore.getState()).toMatchObject({ user, accessToken: 'token', isAuthenticated: true, isInitializing: false });
    useAuthStore.getState().setToken('new-token');
    useAuthStore.getState().setInitializing(true);
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'new-token', isInitializing: true });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
