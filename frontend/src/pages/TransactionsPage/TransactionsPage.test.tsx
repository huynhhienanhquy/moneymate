import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { cleanup, screen } from '@/test/render';
import TransactionsPage from './TransactionsPage';

describe('TransactionsPage', () => {
  it('renders transaction history', () => {
    renderPage(TransactionsPage);
    expect(screen.getAllByText('Ăn trưa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ăn uống').length).toBeGreaterThan(0);
  });

  it('opens the create form and renders empty results', () => {
    renderPage(TransactionsPage);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Thêm giao dịch/ })));
    expect(screen.getAllByText('Thêm giao dịch').length).toBeGreaterThan(1);
    cleanup();
    renderPage(TransactionsPage, 'empty');
    expect(screen.getByText('Không tìm thấy giao dịch nào')).toBeInTheDocument();
  });
});
