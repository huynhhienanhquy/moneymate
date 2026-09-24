import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import MonthlyBalancePage from './MonthlyBalancePage';
import { within } from '@testing-library/react';
import { formatVND } from '@/utils/formatCurrency';

describe('MonthlyBalancePage', () => {
  it('shows each month\'s assets and carries negative savings into the cumulative total', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 6));
    try {
      renderPage(MonthlyBalancePage);
      const expected = [
        [5_000_000, 4_000_000, 1_000_000, 1_000_000],
        [3_000_000, 4_000_000, -1_000_000, 0],
        [7_000_000, 2_000_000, 5_000_000, 5_000_000],
      ];
      expected.forEach((amounts, index) => {
        const row = screen.getByRole('row', { name: new RegExp(`^Tháng ${index + 1} `) });
        const cells = within(row).getAllByRole('cell');
        amounts.forEach((amount, column) => expect(cells[column + 1]).toHaveTextContent(formatVND(amount)));
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders monthly income and saving data', () => {
    renderPage(MonthlyBalancePage);
    expect(screen.getByText('Tiết kiệm mỗi tháng')).toBeInTheDocument();
    expect(screen.getAllByText(/Tổng thu nhập/).length).toBeGreaterThan(0);
  });

  it('renders the loading state', () => {
    renderPage(MonthlyBalancePage, 'loading');
    expect(screen.getByText('Tiết kiệm mỗi tháng')).toBeInTheDocument();
  });
});
