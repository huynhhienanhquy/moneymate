import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { cleanup, screen } from '@/test/render';
import AdminPage from './AdminPage';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';

describe('AdminPage', () => {
  it('renders users and their account information', () => {
    renderPage(AdminPage);
    expect(screen.getByRole('heading', { name: 'Quản lý người dùng' })).toBeInTheDocument();
    expect(screen.getByText('user@moneymate.vn')).toBeInTheDocument();
    expect(screen.getByText(/Hiển thị 1 - 1 của 1/)).toBeInTheDocument();
  });

  it('renders loading and empty states', () => {
    renderPage(AdminPage, 'loading');
    expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    cleanup();
    renderPage(AdminPage, 'empty');
    expect(screen.getByText('Không tìm thấy người dùng phù hợp')).toBeInTheDocument();
  });

  it('revokes the server session and clears local auth before navigating', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const authLogoutMock = useAuthStore((state) => state.logout) as ReturnType<typeof vi.fn>;
    const navigateMock = useNavigate() as ReturnType<typeof vi.fn>;
    renderPage(AdminPage);

    await act(async () => screen.getByRole('button', { name: /Đăng xuất/ }).click());

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(authLogoutMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });
});
