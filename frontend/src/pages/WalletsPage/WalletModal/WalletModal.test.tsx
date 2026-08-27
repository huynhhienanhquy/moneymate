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
