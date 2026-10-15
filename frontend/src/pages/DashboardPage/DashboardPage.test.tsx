import { renderPage } from '@/test/pageTest';
import { within } from '@testing-library/react';
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

  it('keeps monthly income separate from total assets', () => {
    renderPage(DashboardPage);
    const incomeCard = screen.getByText('Thu nhập tháng này').parentElement!.parentElement!;
    const assetsCard = screen.getByRole('region', { name: 'Tổng tài sản' });
    expect(within(incomeCard).getByText(/10\.000\.000/)).toBeInTheDocument();
    expect(within(assetsCard).getByText(/5\.000\.000/)).toBeInTheDocument();
  });

  it('shows an explicit error instead of zeroed financial data', () => {
    renderPage(DashboardPage, 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải tổng quan tài chính');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
