import { act } from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@/test/render';
import { TransactionConfirmation } from './TransactionConfirmation';
import type { UpdateTransactionDraft } from './transactionToolDefinitions';

const mocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), remove: vi.fn() }));
vi.mock('@/services/api/client', () => ({ default: { get: mocks.get, put: mocks.put, delete: mocks.remove } }));
vi.mock('@/stores/auth.store', () => ({ useAuthStore: (selector: (state: { user: { id: string } }) => unknown) => selector({ user: { id: 'owner-user' } }) }));
vi.mock('@/hooks/useReferenceData', () => ({
  useWallets: () => ({ data: [{ id: 'wallet-1', name: 'Tiền mặt' }, { id: 'wallet-2', name: 'Ngân hàng' }], isLoading: false, isError: false }),
  useCategories: () => ({ data: [{ id: 'food', name: 'Ăn uống', type: 'EXPENSE' }, { id: 'salary', name: 'Lương', type: 'INCOME' }], isLoading: false, isError: false }),
}));

const transaction = {
  id: '11111111-1111-4111-8111-111111111111', version: 3, amount: '120000', type: 'EXPENSE',
  walletId: 'wallet-1', categoryId: 'food', transactionDate: '2026-01-01T00:00:00.000Z',
  note: 'Ăn trưa', wallet: { name: 'Tiền mặt' }, category: { name: 'Ăn uống', type: 'EXPENSE' },
};

function show(mode: 'update' | 'delete', draft: Partial<UpdateTransactionDraft> = { amount: 150000 }, respond = vi.fn().mockResolvedValue(undefined)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
  render(<QueryClientProvider client={client}><TransactionConfirmation mode={mode} draft={{ transactionId: transaction.id, ...draft }} toolCallId="call-one" respond={respond} /></QueryClientProvider>);
  return { respond, invalidate };
}
async function confirm(mode: 'update' | 'delete') {
  const button = screen.getByRole('button', { name: mode === 'update' ? 'Xác nhận cập nhật' : 'Xác nhận xóa' });
  await waitFor(() => expect(button).toBeEnabled());
  await act(async () => { fireEvent.click(button); });
}

describe('Copilot transaction confirmations', () => {
  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({ data: { data: transaction } });
    mocks.put.mockReset().mockResolvedValue({ data: { data: { ...transaction, version: 4 } } });
    mocks.remove.mockReset().mockResolvedValue({ data: { data: null } });
  });

  it('shows the existing transaction and proposed changes, then updates only requested fields with its reviewed version', async () => {
    const { respond, invalidate } = show('update', { amount: 150000, note: '' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Xác nhận cập nhật' })).toBeEnabled());
    expect(screen.getByLabelText('Thay đổi đề xuất')).toHaveTextContent('Số tiền');
    expect(screen.getByLabelText('Thay đổi đề xuất')).toHaveTextContent('Ăn trưa → (Trống)');
    expect(mocks.put).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    await confirm('update');
    expect(mocks.put).toHaveBeenCalledTimes(1);
    expect(mocks.put).toHaveBeenCalledWith(`/transactions/${transaction.id}`, { version: 3, amount: 150000, note: '' }, { headers: { 'Idempotency-Key': 'copilot-update-call-one-0' } });
    expect(respond).toHaveBeenCalledWith({ success: true, action: 'updateTransaction', transactionId: transaction.id });
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it.each(['update', 'delete'] as const)('cancels %s without mutating data', async mode => {
    const { respond } = show(mode);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Hủy' })); });
    expect(respond).toHaveBeenCalledWith({ success: false, cancelled: true, action: mode === 'update' ? 'updateTransaction' : 'deleteTransaction' });
    expect(mocks.put).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('requires explicit confirmation for deletion and prevents double clicks', async () => {
    let complete!: (value: unknown) => void;
    mocks.remove.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const { respond, invalidate } = show('delete', {});
    const button = screen.getByRole('button', { name: 'Xác nhận xóa' });
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByText('Ăn trưa')).toBeInTheDocument();
    expect(mocks.remove).not.toHaveBeenCalled();
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    expect(mocks.remove).toHaveBeenCalledTimes(1);
    expect(mocks.remove).toHaveBeenCalledWith(`/transactions/${transaction.id}`, {
      headers: { 'Idempotency-Key': 'copilot-delete-call-one-0' }, params: { version: 3 },
    });
    expect(respond).not.toHaveBeenCalled();
    await act(async () => { complete({ data: { data: null } }); });
    expect(respond).toHaveBeenCalledWith({ success: true, action: 'deleteTransaction', transactionId: transaction.id, deleted: true });
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it.each(['update', 'delete'] as const)('retries an ambiguous %s using the same request and key', async mode => {
    const mutation = mode === 'update' ? mocks.put : mocks.remove;
    mutation.mockRejectedValueOnce(new Error('Network timeout'));
    const { respond } = show(mode);
    await confirm(mode);
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa xác định được kết quả');
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled();
    expect(respond).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })); });
    expect(mutation.mock.calls[1]).toEqual(mutation.mock.calls[0]);
    expect(respond).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it.each(['update', 'delete'] as const)('does not repeat a saved %s if reporting its receipt fails', async mode => {
    const mutation = mode === 'update' ? mocks.put : mocks.remove;
    const respond = vi.fn().mockRejectedValueOnce(new Error('Disconnected')).mockResolvedValue(undefined);
    show(mode, { amount: 150000 }, respond);
    await confirm(mode);
    expect(screen.getByRole('alert')).toHaveTextContent('Đã lưu thay đổi');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất' })); });
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledTimes(2);
  });

  it('requires reviewing a refreshed version after a concurrent edit before sending a new request', async () => {
    mocks.put.mockRejectedValueOnce({ response: { status: 409, data: { code: 'VERSION_CONFLICT' } } });
    show('update');
    await confirm('update');
    expect(screen.getByRole('alert')).toHaveTextContent('Giao dịch đã thay đổi');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeDisabled();
    mocks.get.mockResolvedValueOnce({ data: { data: { ...transaction, version: 4, amount: '130000' } } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tải lại giao dịch' })); });
    expect(mocks.put).toHaveBeenCalledTimes(1);
    await confirm('update');
    expect(mocks.put.mock.calls[1]).toEqual([`/transactions/${transaction.id}`, { version: 4, amount: 150000 }, { headers: { 'Idempotency-Key': 'copilot-update-call-one-1' } }]);
  });

  it('allows cancelling a rejected conflict even if the transaction has since disappeared', async () => {
    mocks.remove.mockRejectedValueOnce({ response: { status: 409, data: { code: 'VERSION_CONFLICT' } } });
    const { respond } = show('delete', {});
    await confirm('delete');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Hủy' })); });
    expect(respond).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    expect(mocks.remove).toHaveBeenCalledTimes(1);
  });

  it('does not mutate a missing or inaccessible transaction', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } });
    show('delete', {});
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Xác nhận xóa' })).toBeDisabled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('blocks transfer deletion', async () => {
    mocks.get.mockResolvedValue({ data: { data: { ...transaction, type: 'TRANSFER' } } });
    show('delete', {});
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Xác nhận xóa' })).toBeDisabled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('updates wallet/category/type by verified names', async () => {
    show('update', { type: 'INCOME', walletName: 'Ngân hàng', categoryName: 'Lương' });
    await confirm('update');
    expect(mocks.put.mock.calls[0][1]).toEqual({ version: 3, type: 'INCOME', walletId: 'wallet-2', categoryId: 'salary' });
  });

  it.each([{}, { type: 'INCOME' }] as Partial<UpdateTransactionDraft>[])('blocks an empty update or a type change without a compatible category', async draft => {
    show('update', draft);
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Xác nhận cập nhật' })).toBeDisabled();
    expect(mocks.put).not.toHaveBeenCalled();
  });
});
