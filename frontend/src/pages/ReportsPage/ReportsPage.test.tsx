import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import ReportsPage from './ReportsPage';
import { formatVND } from '@/utils/formatCurrency';

describe('ReportsPage', () => {
  it('renders monthly figures and switches to yearly mode', () => {
    renderPage(ReportsPage);
    expect(screen.getByRole('heading', { name: 'Báo cáo tài chính' })).toBeInTheDocument();
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    expect(screen.getByText(formatVND(5_000_000))).toBeInTheDocument();
    expect(screen.getByText('Tiết kiệm').parentElement?.parentElement).toHaveTextContent(formatVND(1_000_000));
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Theo năm' })));
    expect(screen.getByText(/Năm \d{4}/)).toBeInTheDocument();
    expect(screen.getByText(formatVND(5_000_000))).toBeInTheDocument();
    expect(screen.getByText(formatVND(-43_000_000))).toBeInTheDocument();
    expect(screen.queryByText(formatVND(120_000_000))).not.toBeInTheDocument();
  });

  it('renders the empty expense state', () => {
    renderPage(ReportsPage, 'empty');
    expect(screen.getByText('Chưa có dữ liệu chi tiêu')).toBeInTheDocument();
  });
});
