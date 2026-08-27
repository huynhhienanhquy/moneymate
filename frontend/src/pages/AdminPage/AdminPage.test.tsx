import { renderPage } from '@/test/pageTest';
import { cleanup, screen } from '@/test/render';
import AdminPage from './AdminPage';

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
});
