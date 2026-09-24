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
    expect(document.getElementById('edit-tx-tx-transfer')).not.toBeInTheDocument();
    expect(document.getElementById('del-tx-tx-transfer')).not.toBeInTheDocument();
  });

  it('opens the create form and renders empty results', () => {
    renderPage(TransactionsPage);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Thêm giao dịch/ })));
    expect(screen.getAllByText('Thêm giao dịch').length).toBeGreaterThan(1);
    cleanup();
    renderPage(TransactionsPage, 'empty');
    expect(screen.getByText('Không tìm thấy giao dịch nào')).toBeInTheDocument();
  });

  it('shows an insufficient balance message before creating an oversized expense', async () => {
    renderPage(TransactionsPage);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Thêm giao dịch/ })));

    act(() => {
      fireEvent.change(document.getElementById('tx-amount')!, { target: { value: '6000000' } });
      fireEvent.change(document.getElementById('tx-wallet')!, { target: { value: 'wallet-1' } });
      fireEvent.change(document.getElementById('tx-category')!, { target: { value: 'category-1' } });
      fireEvent.click(document.getElementById('tx-save')!);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Số dư không đủ');
  });

  it('distinguishes an API error from an empty transaction list', () => {
    renderPage(TransactionsPage, 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải danh sách giao dịch');
    expect(screen.queryByText('Không tìm thấy giao dịch nào')).not.toBeInTheDocument();
  });
});
