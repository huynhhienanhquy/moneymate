import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import BudgetsPage from './BudgetsPage';

describe('BudgetsPage', () => {
  it('renders budget progress and opens the create form', () => {
    renderPage(BudgetsPage);
    expect(screen.getByText('Tổng ngân sách')).toBeInTheDocument();
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    act(() => fireEvent.click(screen.getAllByRole('button', { name: /Thêm Ngân sách/i })[0]));
    expect(screen.getByText('Tổng chi tiêu (Global)')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    renderPage(BudgetsPage, 'empty');
    expect(screen.getByText('Chưa có ngân sách tháng này')).toBeInTheDocument();
  });
});
