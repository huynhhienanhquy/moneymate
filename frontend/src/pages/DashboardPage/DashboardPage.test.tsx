import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  it('renders the financial overview', () => {
    renderPage(DashboardPage);
    expect(screen.getByText('Tổng quan tài chính')).toBeInTheDocument();
    expect(screen.getByText('Tổng tài sản')).toBeInTheDocument();
    expect(screen.getByText('Ăn trưa')).toBeInTheDocument();
  });

  it('renders its loading state', () => {
    renderPage(DashboardPage, 'loading');
    expect(screen.getByText('Đang tải tổng quan tài chính...')).toBeInTheDocument();
  });

  it('shows an explicit error instead of zeroed financial data', () => {
    renderPage(DashboardPage, 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải tổng quan tài chính');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
