import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import ReceiptScanModal from './ReceiptScanModal';

const setFile = vi.fn();
const scan = vi.fn();
const reset = vi.fn();
let hookState: {
  file: File | null;
  result: null | { amount: number; transactionDate: string; merchant: string; suggestedCategoryName: string; poweredBy: string };
  isScanning: boolean;
} = { file: null, result: null, isScanning: false };

vi.mock('@/hooks/components/useReceiptScanner', () => ({
  useReceiptScanner: () => ({ ...hookState, setFile, scan, reset }),
}));

describe('ReceiptScanModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState = { file: null, result: null, isScanning: false };
  });

  it('disables scanning until a receipt is selected and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ReceiptScanModal onClose={onClose} onApply={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Quét hóa đơn' })).toBeDisabled();
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies a recognized scan result and can reset it', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    hookState = { file: null, isScanning: false, result: { amount: 125000, transactionDate: '2026-08-26', merchant: 'MoneyMate Mart', suggestedCategoryName: 'Ăn uống', poweredBy: 'AI' } };
    render(<ReceiptScanModal onClose={vi.fn()} onApply={onApply} />);

    expect(screen.getByText('Đã nhận diện dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('125.000 ₫')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quét lại' }));
    expect(reset).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(onApply).toHaveBeenCalledWith(hookState.result);
  });
});
