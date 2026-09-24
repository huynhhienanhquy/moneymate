import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import ReportsPage, { buildYearlyChartData, isFutureReportPeriod } from './ReportsPage';
import { formatVND } from '@/utils/formatCurrency';

describe('ReportsPage', () => {
  it('identifies only months and years after the current period as future', () => {
    const now = new Date(2026, 8, 15);

    expect(isFutureReportPeriod('monthly', 9, 2026, now)).toBe(false);
    expect(isFutureReportPeriod('monthly', 10, 2026, now)).toBe(true);
    expect(isFutureReportPeriod('monthly', 12, 2025, now)).toBe(false);
    expect(isFutureReportPeriod('yearly', 1, 2026, now)).toBe(false);
    expect(isFutureReportPeriod('yearly', 1, 2027, now)).toBe(true);
  });

  it('builds the yearly chart from monthly wallet balances and excludes unavailable months', () => {
    const chartData = buildYearlyChartData([
      { month: 1, label: 'T1', income: 999, walletBalance: 1_000_000, expense: 100_000 },
      { month: 3, label: 'T3', income: 999, walletBalance: 3_000_000, expense: 300_000 },
      { month: 9, label: 'T9', income: 999, walletBalance: 9_000_000, expense: 900_000 },
      { month: 10, label: 'T10', income: 999, walletBalance: 10_000_000, expense: 1_000_000 },
    ], 2026, '2026-03-10', new Date(2026, 8, 15));

    expect(chartData).toEqual([
      expect.objectContaining({ month: 3, income: 3_000_000, expense: 300_000 }),
      expect.objectContaining({ month: 9, income: 9_000_000, expense: 900_000 }),
    ]);
  });

  it('renders monthly figures and switches to yearly mode', () => {
    renderPage(ReportsPage);
    expect(screen.getByRole('heading', { name: 'Báo cáo tài chính' })).toBeInTheDocument();
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    expect(screen.getByText(formatVND(5_000_000))).toBeInTheDocument();
    expect(screen.getByText('Tiết kiệm').parentElement?.parentElement).toHaveTextContent(formatVND(1_000_000));
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Theo năm' })));
    expect(screen.getByText('Tổng thu nhập năm này')).toBeInTheDocument();
    expect(screen.getByText(/Năm \d{4}/)).toBeInTheDocument();
    expect(screen.getByText(formatVND(120_000_000))).toBeInTheDocument();
    expect(screen.getByText(formatVND(72_000_000))).toBeInTheDocument();
  });

  it('renders the empty expense state', () => {
    renderPage(ReportsPage, 'empty');
    expect(screen.getByText('Chưa có dữ liệu chi tiêu')).toBeInTheDocument();
  });

  it('shows no data and disables exports for a future month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 15));

    try {
      renderPage(ReportsPage);
      act(() => fireEvent.click(screen.getByRole('button', { name: 'Kỳ sau' })));

      expect(screen.getByText('Tháng 10, 2026')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Không có dữ liệu' })).toBeInTheDocument();
      expect(screen.getByText('Kỳ báo cáo này chưa diễn ra. Hãy chọn tháng hoặc năm hiện tại hay trước đó.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Xuất\s*PDF/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Xuất\s*Excel/ })).toBeDisabled();
      expect(screen.queryByText('Tổng thu nhập tháng này')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows no data for a future year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 15));

    try {
      renderPage(ReportsPage);
      act(() => fireEvent.click(screen.getByRole('button', { name: 'Theo năm' })));
      act(() => fireEvent.click(screen.getByRole('button', { name: 'Kỳ sau' })));

      expect(screen.getByText('Năm 2027')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Không có dữ liệu' })).toBeInTheDocument();
      expect(screen.queryByText('Tổng thu nhập năm này')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
