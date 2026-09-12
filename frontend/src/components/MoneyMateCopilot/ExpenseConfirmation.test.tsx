import { act } from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { render, screen } from '@/test/render';
import { ExpenseConfirmation } from './ExpenseConfirmation';

const mocks = vi.hoisted(() => ({
  post: vi.fn(), invalidate: vi.fn(),
  referenceError: false,
  wallets: [{ id: 'wallet-a', name: 'Tiền mặt' }, { id: 'wallet-b', name: 'Ngân hàng' }],
}));
vi.mock('@/hooks/useReferenceData', () => ({
  useWallets: () => ({ data: mocks.wallets, isLoading: false, isError: mocks.referenceError }),
  useCategories: () => ({ data: [{ id: 'food', name: 'Ăn uống', type: 'EXPENSE' }, { id: 'salary', name: 'Lương', type: 'INCOME' }] }),
}));
vi.mock('@/services/api/client', () => ({ default: { post: mocks.post } }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));

describe('ExpenseConfirmation', () => {
  beforeEach(() => {
    mocks.referenceError = false;
    mocks.post.mockReset().mockResolvedValue({ data: { data: { id: 'saved-expense' } } });
    mocks.invalidate.mockReset().mockResolvedValue(undefined);
  });

  function show(respond = vi.fn().mockResolvedValue(undefined)) {
    render(<ExpenseConfirmation toolCallId="call-one" draft={{ amount: 12, categoryName: 'ăn uống', date: '2026-01-01', note: 'Ăn trưa' }} respond={respond} />);
    return respond;
  }

  it('requires confirmation and a wallet, saves exactly 12 VND and refreshes financial queries', async () => {
    const respond = show();
    expect(screen.getByRole('form', { name: 'Xác nhận khoản chi' })).toBeInTheDocument();
    expect(screen.getByText('Kiểm tra khoản chi')).toBeInTheDocument();
    expect(screen.getByText('Bạn luôn có quyền kiểm tra trước khi lưu.')).toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Ví')).toHaveValue('');
    expect(screen.getByLabelText('Danh mục')).toHaveValue('food');
    expect(screen.queryByRole('option', { name: 'Lương' })).not.toBeInTheDocument();
    act(() => fireEvent.change(screen.getByLabelText('Ví'), { target: { value: 'wallet-b' } }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lưu' })); });
    expect(mocks.post).toHaveBeenCalledWith('/transactions', {
      amount: 12, walletId: 'wallet-b', categoryId: 'food', transactionDate: '2026-01-01', note: 'Ăn trưa', type: 'EXPENSE',
    }, { headers: { 'Idempotency-Key': 'copilot-expense-call-one-0' } });
    expect(respond).toHaveBeenCalledWith(expect.objectContaining({ success: true, transactionId: 'saved-expense', amount: 12 }));
    expect(mocks.invalidate).toHaveBeenCalledTimes(1);
  });

  it('cancels without writing a transaction', async () => {
    const respond = show();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Hủy' })); });
    expect(respond).toHaveBeenCalledWith({ success: false, cancelled: true });
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('blocks saving and repeated cancellation while cancellation is pending', async () => {
    let complete!: () => void;
    const respond = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    show(respond);
    act(() => fireEvent.change(screen.getByLabelText('Ví'), { target: { value: 'wallet-a' } }));
    act(() => {
      const cancel = screen.getByRole('button', { name: 'Hủy' });
      fireEvent.click(cancel);
      fireEvent.click(cancel);
      fireEvent.submit(screen.getByLabelText('Ví').closest('form')!);
    });
    expect(respond).toHaveBeenCalledTimes(1);
    expect(mocks.post).not.toHaveBeenCalled();
    await act(async () => { complete(); });
  });

  it('blocks double submission and retries ambiguous failures with the same payload/key', async () => {
    let reject!: (error: Error) => void;
    mocks.post.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
    const respond = show();
    act(() => fireEvent.change(screen.getByLabelText('Ví'), { target: { value: 'wallet-a' } }));
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lưu' }));
      fireEvent.submit(screen.getByLabelText('Ví').closest('form')!);
    });
    expect(mocks.post).toHaveBeenCalledTimes(1);
    await act(async () => { reject(new Error('Network timeout')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa xác định được kết quả lưu');
    expect(screen.getByLabelText('Số tiền (đ)')).toBeDisabled();
    expect(respond).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })); });
    expect(mocks.post.mock.calls[1]).toEqual(mocks.post.mock.calls[0]);
    expect(respond).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('allows correcting a rejected request using a fresh idempotency key', async () => {
    mocks.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Số dư không đủ' } } });
    show();
    act(() => fireEvent.change(screen.getByLabelText('Ví'), { target: { value: 'wallet-a' } }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lưu' })); });
    expect(screen.getByRole('alert')).toHaveTextContent('Số dư không đủ');
    expect(screen.getByLabelText('Số tiền (đ)')).not.toBeDisabled();
    act(() => fireEvent.change(screen.getByLabelText('Số tiền (đ)'), { target: { value: '10' } }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lưu' })); });
    expect(mocks.post.mock.calls[1][2].headers['Idempotency-Key']).toBe('copilot-expense-call-one-1');
  });

  it('does not save again if returning the successful result to the agent fails', async () => {
    const respond = vi.fn().mockRejectedValueOnce(new Error('Disconnected')).mockResolvedValueOnce(undefined);
    show(respond);
    act(() => fireEvent.change(screen.getByLabelText('Ví'), { target: { value: 'wallet-a' } }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lưu' })); });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Đã lưu giao dịch'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất' })); });
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledTimes(2);
  });

  it('can finish a saved transaction even if refreshing reference data fails', async () => {
    mocks.invalidate.mockImplementationOnce(async () => { mocks.referenceError = true; });
    const respond = vi.fn().mockRejectedValueOnce(new Error('Disconnected')).mockResolvedValueOnce(undefined);
    show(respond);
    act(() => fireEvent.change(screen.getByLabelText('Ví'), { target: { value: 'wallet-a' } }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Xác nhận lưu' })); });
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất' })); });
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledTimes(2);
  });
});
