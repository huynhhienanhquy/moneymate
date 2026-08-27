import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import MonthlyBalancePage from './MonthlyBalancePage';

describe('MonthlyBalancePage', () => {
  it('renders monthly income and saving data', () => {
    renderPage(MonthlyBalancePage);
    expect(screen.getByText('Tiết kiệm mỗi tháng')).toBeInTheDocument();
    expect(screen.getAllByText(/Tổng lương/).length).toBeGreaterThan(0);
  });

  it('renders the loading state', () => {
    renderPage(MonthlyBalancePage, 'loading');
    expect(screen.getByText('Tiết kiệm mỗi tháng')).toBeInTheDocument();
  });
});
