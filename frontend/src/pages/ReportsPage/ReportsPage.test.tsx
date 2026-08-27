import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import ReportsPage from './ReportsPage';

describe('ReportsPage', () => {
  it('renders monthly figures and switches to yearly mode', () => {
    renderPage(ReportsPage);
    expect(screen.getByRole('heading', { name: 'Báo cáo tài chính' })).toBeInTheDocument();
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Theo năm' })));
    expect(screen.getByText(/Năm \d{4}/)).toBeInTheDocument();
  });

  it('renders the empty expense state', () => {
    renderPage(ReportsPage, 'empty');
    expect(screen.getByText('Chưa có dữ liệu chi tiêu')).toBeInTheDocument();
  });
});
