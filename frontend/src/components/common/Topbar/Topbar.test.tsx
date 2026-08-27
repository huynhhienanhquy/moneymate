import { act } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { render } from '@/test/render';
import Topbar from './Topbar';

vi.mock('@/components/NotificationBell/NotificationBell', () => ({ default: () => <span>notifications</span> }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a> }));

it('renders the current page and delegates topbar actions', () => {
  const onMenuOpen = vi.fn();
  const onThemeToggle = vi.fn();
  render(
    <Topbar user={null} theme="light" currentPage="Ví tài khoản" onMenuOpen={onMenuOpen} onThemeToggle={onThemeToggle} />,
  );

  expect(screen.getByText('Ví tài khoản')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mở hồ sơ' })).toHaveAttribute('href', '/profile');
  act(() => fireEvent.click(screen.getByRole('button', { name: 'Mở menu' })));
  act(() => fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' })));
  expect(onMenuOpen).toHaveBeenCalledOnce();
  expect(onThemeToggle).toHaveBeenCalledOnce();
});
