import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import Layout from './PageLayout';

const mocks = vi.hoisted(() => ({ logout: vi.fn(), navigate: vi.fn(), toggleTheme: vi.fn(), post: vi.fn().mockResolvedValue({}) }));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => <a href={to} {...props}>{children}</a>,
  Outlet: () => <p>page outlet</p>,
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => ({ user: { fullName: 'Admin', role: 'ADMIN' }, logout: mocks.logout }) }));
vi.mock('@/stores/theme.store', () => ({ useThemeStore: () => ({ theme: 'light', toggleTheme: mocks.toggleTheme }) }));
vi.mock('@/services/api/client', () => ({ default: { post: mocks.post } }));
vi.mock('@/components/NotificationBell/NotificationBell', () => ({ default: () => <span>notifications</span> }));
vi.mock('@/components/AiChatWidget/AiChatWidget', () => ({ default: () => <span>ai chat</span> }));

describe('PageLayout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders navigation, admin link and content outlet', () => {
    render(<Layout />);
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument();
    expect(screen.getAllByText('Quản trị').length).toBeGreaterThan(0);
    expect(screen.getByText('page outlet')).toBeInTheDocument();
  });

  it('toggles theme and logs out', async () => {
    const user = userEvent.setup();
    render(<Layout />);
    const themeButtons = screen.getAllByRole('button', { name: /Giao diện tối/i });
    await user.click(themeButtons[0]);
    expect(mocks.toggleTheme).toHaveBeenCalled();
    const logoutButtons = screen.getAllByRole('button', { name: /Đăng xuất/i });
    await user.click(logoutButtons[0]);
    await vi.waitFor(() => expect(mocks.logout).toHaveBeenCalled());
    expect(mocks.navigate).toHaveBeenCalledWith('/login');
  });
});
