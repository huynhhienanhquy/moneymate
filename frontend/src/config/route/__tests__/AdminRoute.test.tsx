import { render, screen } from '@/test/render';
import { routeAuth } from '@/test/routeTestMocks';
import AdminRoute from '../AdminRoute';

describe('AdminRoute', () => {
  it('redirects regular users', () => {
    routeAuth.state = { user: { role: 'USER' }, isAuthenticated: true, isInitializing: false };
    render(<AdminRoute />);
    expect(screen.getByText('navigate:/')).toBeInTheDocument();
  });

  it('renders admin content', () => {
    routeAuth.state = { user: { role: 'ADMIN' }, isAuthenticated: true, isInitializing: false };
    render(<AdminRoute />);
    expect(screen.getByText('outlet')).toBeInTheDocument();
  });
});
