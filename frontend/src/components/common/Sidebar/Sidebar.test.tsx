import { act } from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
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

it('keeps keyboard focus in the mobile drawer and restores it on close', () => {
  const onMobileOpenChange = vi.fn();
  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  trigger.focus();
  const props = { user, currentPath: '/', theme: 'light' as const, onMobileOpenChange, onThemeToggle: vi.fn(), onLogout: vi.fn() };
  const { rerender } = render(<Sidebar {...props} mobileOpen />);
  const drawer = screen.getByRole('dialog', { name: 'Menu điều hướng' });
  const closeButton = within(drawer).getByRole('button', { name: 'Đóng menu' });
  const logoutButton = within(drawer).getByRole('button', { name: 'Đăng xuất' });
  expect(closeButton).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(logoutButton).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(closeButton).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onMobileOpenChange).toHaveBeenCalledWith(false);
  rerender(<Sidebar {...props} mobileOpen={false} />);
  expect(screen.queryByRole('dialog', { name: 'Menu điều hướng' })).not.toBeInTheDocument();
  expect(document.querySelector('.app-drawer-backdrop')).toHaveAttribute('inert');
  expect(document.querySelector('.app-drawer-backdrop')).toHaveAttribute('aria-hidden', 'true');
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
  trigger.remove();
});
