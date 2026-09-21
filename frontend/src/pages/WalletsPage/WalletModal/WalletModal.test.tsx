import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react';
import { render } from '@/test/render';
import WalletModal from './WalletModal';

it('keeps the wallet form behavior after extraction', () => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(<WalletModal onClose={onClose} onSave={onSave} loading={false} />);

  act(() => {
    fireEvent.change(screen.getByPlaceholderText('VD: Tiền mặt, Techcombank...'), { target: { value: 'Tiền mặt' } });
  });
  act(() => fireEvent.click(screen.getByRole('button', { name: 'Tạo ví' })));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tiền mặt', type: 'CASH' }));
});

it('allows the stored balance to be edited and submitted', () => {
  const onSave = vi.fn();
  render(<WalletModal
    wallet={{ name: 'Ví chính', type: 'CASH', currency: 'VND', initialBalance: 5_000_000 }}
    onClose={vi.fn()}
    onSave={onSave}
    loading={false}
  />);

  expect(screen.getByLabelText('Số dư hiện tại')).toHaveValue(5_000_000);
  act(() => fireEvent.change(screen.getByLabelText('Số dư hiện tại'), { target: { value: '6500000' } }));
  act(() => fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' })));
  expect(onSave).toHaveBeenCalledWith({ name: 'Ví chính', type: 'CASH', initialBalance: 6_500_000 });
});
