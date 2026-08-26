import { render, screen } from '@/test/render';
import AuthShell from './AuthShell';

describe('AuthShell', () => {
  it('renders content, brand and footer navigation', () => {
    render(<AuthShell titleId="login-title"><h1 id="login-title">Đăng nhập</h1></AuthShell>);

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getAllByText('MoneyMate')).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: 'Liên kết chân trang' })).toBeInTheDocument();
  });

  it('applies the register layout modifier', () => {
    const { container } = render(<AuthShell titleId="register-title" register><h1 id="register-title">Đăng ký</h1></AuthShell>);
    expect(container.querySelector('main')).toHaveClass('auth-page-register');
  });
});
