import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { render, screen } from '@/test/render';
import { within, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import api from '@/services/api/client';
import AdminPage from './AdminPage';
import { exportUsers, type AdminUser } from './adminUsers';

vi.mock('@/services/api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('./adminUsers', async (importOriginal) => ({
  ...await importOriginal<typeof import('./adminUsers')>(), exportUsers: vi.fn(),
}));
const auth = vi.hoisted(() => ({ user: { id: 'current-admin' }, logout: vi.fn(), login: vi.fn() }));
vi.mock('@/stores/auth.store', () => ({ useAuthStore: (selector: (state: typeof auth) => unknown) => selector(auth) }));
const users: AdminUser[] = Array.from({ length: 7 }, (_, number) => ({
  id: `account-${number}`, fullName: `Member ${number}`, email: `member${number}@example.com`,
  role: number < 2 ? 'ADMIN' : 'USER', createdAt: '2026-08-01',
  _count: { transactions: number, wallets: 1 },
}));
function renderAdmin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AdminPage /></QueryClientProvider>);
}
function setupActions() {
  const user = userEvent.setup();
  return {
    click: (element: Element) => act(async () => { await user.click(element); }),
    type: (element: Element, text: string) => act(async () => { await user.type(element, text); }),
    keyboard: (text: string) => act(async () => { await user.keyboard(text); }),
    selectOptions: (element: Element, value: string) => act(async () => { await user.selectOptions(element, value); }),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockResolvedValue({ data: { data: users } });
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  vi.mocked(api.put).mockResolvedValue({ data: {} });
  vi.mocked(api.delete).mockResolvedValue({ data: {} });
});

describe('admin user management interactions', () => {
  it('calculates summaries from all users and combines search, role filters and pagination', async () => {
    const actions = setupActions();
    renderAdmin();
    await screen.findByText('member0@example.com');
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 7 ví tiền')).toBeInTheDocument();
    expect(screen.getByText('Hiển thị 1 - 6 của 7 người dùng')).toBeInTheDocument();
    await actions.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(screen.getByText('member6@example.com')).toBeInTheDocument();
    await actions.click(screen.getByRole('button', { name: 'Admin (2)' }));
    expect(screen.getByText('Hiển thị 1 - 2 của 2 người dùng')).toBeInTheDocument();
    await actions.type(screen.getByRole('searchbox'), 'member1@');
    expect(screen.getByText('member1@example.com')).toBeInTheDocument();
    expect(screen.queryByText('member0@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
    await actions.click(screen.getByRole('button', { name: 'Xuất danh sách' }));
    expect(exportUsers).toHaveBeenCalledWith([users[1]]);
  });

  it('sorts names in both directions and focuses search using the keyboard shortcut', async () => {
    const actions = setupActions();
    renderAdmin();
    await screen.findByText('member0@example.com');
    await actions.click(screen.getByRole('button', { name: 'Sắp xếp theo thành viên' }));
    await actions.click(screen.getByRole('button', { name: 'Sắp xếp theo thành viên' }));
    expect(within(screen.getAllByRole('row')[1]).getByText('Member 6')).toBeInTheDocument();
    await actions.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('creates a User through registration without replacing the admin session', async () => {
    const actions = setupActions();
    renderAdmin();
    await screen.findByText('member0@example.com');
    await actions.click(screen.getByRole('button', { name: 'Thêm người dùng' }));
    await actions.type(screen.getByLabelText('Họ và tên'), 'New Member');
    await actions.type(screen.getByLabelText('Email', { exact: true }), 'new@example.com');
    await actions.type(screen.getByLabelText(/Mật khẩu/), 'secret-pass');
    await actions.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', { fullName: 'New Member', email: 'new@example.com', password: 'secret-pass' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(auth.login).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('updates a selected account and keeps failed changes visible for retry', async () => {
    const actions = setupActions();
    vi.mocked(api.put).mockRejectedValueOnce(new Error('offline'));
    renderAdmin();
    await screen.findByText('member0@example.com');
    await actions.click(screen.getByRole('button', { name: 'Quản lý Member 2' }));
    await actions.selectOptions(screen.getByLabelText('Phân quyền'), 'ADMIN');
    await actions.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu thay đổi');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(api.put).toHaveBeenCalledWith('/admin/users/account-2', { fullName: 'Member 2', role: 'ADMIN' });
    await actions.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows a retryable API error instead of a misleading empty user list', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('offline'));
    renderAdmin();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách người dùng');
    expect(screen.queryByText('Không tìm thấy người dùng phù hợp')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xuất danh sách' })).toBeDisabled();
  });

  it('deletes only the selected user after confirmation', async () => {
    const actions = setupActions();
    const confirmation = vi.spyOn(globalThis, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderAdmin();
    await screen.findByText('member0@example.com');
    await actions.click(screen.getByRole('button', { name: 'Quản lý Member 2' }));
    await actions.click(screen.getByRole('button', { name: 'Xóa người dùng' }));
    expect(api.delete).not.toHaveBeenCalled();
    await actions.click(screen.getByRole('button', { name: 'Xóa người dùng' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/admin/users/account-2'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    confirmation.mockRestore();
  });
});
