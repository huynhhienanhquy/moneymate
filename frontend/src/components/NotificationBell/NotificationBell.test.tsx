import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import NotificationBell from './NotificationBell';

const setOpen = vi.fn();
const markRead = vi.fn();
const markAllRead = vi.fn();
const remove = vi.fn();
let hookState = {
  open: false,
  notifications: [] as Array<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>,
  unreadCount: 0,
  isLoading: false,
};

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ ...hookState, setOpen, markRead, markAllRead, remove, containerRef: { current: null } }),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState = { open: false, notifications: [], unreadCount: 0, isLoading: false };
  });

  it('toggles the notification panel', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(screen.getByRole('button'));
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it('renders unread notifications and invokes actions', async () => {
    const user = userEvent.setup();
    hookState = {
      open: true,
      unreadCount: 1,
      isLoading: false,
      notifications: [{ id: 'notice-1', title: 'Sắp vượt ngân sách', message: 'Ngân sách ăn uống còn ít.', isRead: false, createdAt: '2026-08-26T08:00:00.000Z' }],
    };
    render(<NotificationBell />);

    expect(screen.getByText('Sắp vượt ngân sách')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đọc tất cả' }));
    expect(markAllRead).toHaveBeenCalledOnce();

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 2]);
    await user.click(buttons[buttons.length - 1]);
    expect(markRead).toHaveBeenCalledWith('notice-1');
    expect(remove).toHaveBeenCalledWith('notice-1');
  });

  it('shows the empty state', () => {
    hookState = { ...hookState, open: true };
    render(<NotificationBell />);
    expect(screen.getByText('Không có thông báo')).toBeInTheDocument();
  });
});
