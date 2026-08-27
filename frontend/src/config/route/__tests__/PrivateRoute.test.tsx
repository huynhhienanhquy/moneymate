import { render, screen } from '@/test/render';
import { routeAuth } from '@/test/routeTestMocks';
import PrivateRoute from '../PrivateRoute';

describe('PrivateRoute', () => {
  it('shows initialization state', () => {
    routeAuth.state = { user: null, isAuthenticated: false, isInitializing: true };
    render(<PrivateRoute />);
    expect(screen.getByText('Đang đồng bộ phiên làm việc...')).toBeInTheDocument();
  });

  it('redirects anonymous users and renders authenticated content', () => {
    routeAuth.state = { user: null, isAuthenticated: false, isInitializing: false };
    render(<PrivateRoute />);
    expect(screen.getByText('navigate:/login')).toBeInTheDocument();
    routeAuth.state = { user: { role: 'USER' }, isAuthenticated: true, isInitializing: false };
    render(<PrivateRoute />);
    expect(screen.getByText('outlet')).toBeInTheDocument();
  });
});
