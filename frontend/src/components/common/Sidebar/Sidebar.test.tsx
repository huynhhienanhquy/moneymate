import { act } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { render } from '@/test/render';
import Sidebar from './Sidebar';

vi.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a> }));

const user = { id: '1', email: 'admin@example.com', fullName: 'Admin User', role: 'ADMIN' } as never;

it('renders navigation and delegates sidebar actions', () => {
  const onThemeToggle = vi.fn();
  const onLogout = vi.fn();
  const onMobileOpenChange = vi.fn();
  render(
    <Sidebar user={user} currentPath="/wallets" theme="dark" mobileOpen onMobileOpenChange={onMobileOpenChange} onThemeToggle={onThemeToggle} onLogout={onLogout} />,
  );

  expect(screen.getAllByRole('link', { name: /Ví tài khoản/ })[0]).toHaveAttribute('aria-current', 'page');
  act(() => fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' })));
  act(() => fireEvent.click(screen.getAllByRole('button', { name: /Giao diện sáng/ })[0]));
  act(() => fireEvent.click(screen.getAllByRole('button', { name: 'Đăng xuất' })[0]));

  expect(onMobileOpenChange).toHaveBeenCalledWith(false);
  expect(onThemeToggle).toHaveBeenCalledOnce();
  expect(onLogout).toHaveBeenCalledOnce();
});
