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
    const renamedUser = { id: 'user-1', email: 'user@moneymate.vn', fullName: 'Money Mate Updated', role: 'USER' } as never;
    useAuthStore.getState().setUser(renamedUser);
    useAuthStore.getState().setInitializing(true);
    expect(useAuthStore.getState()).toMatchObject({ user: renamedUser, accessToken: 'new-token', isInitializing: true });
    expect(JSON.parse(localStorage.getItem('mm_user') || '{}')).toEqual(renamedUser);
    const refreshedUser = { id: 'user-2', email: 'admin@moneymate.vn', fullName: 'Admin', role: 'ADMIN' } as never;
    useAuthStore.getState().setToken('refreshed-token', refreshedUser);
    expect(useAuthStore.getState()).toMatchObject({ user: refreshedUser, accessToken: 'refreshed-token' });
    expect(JSON.parse(localStorage.getItem('mm_user') || '{}')).toEqual(refreshedUser);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
