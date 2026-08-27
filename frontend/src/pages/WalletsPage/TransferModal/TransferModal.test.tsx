import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react';
import { render } from '@/test/render';
import TransferModal from './TransferModal';

it('keeps the transfer form behavior after extraction', () => {
  const onSave = vi.fn();
  render(
    <TransferModal
      wallets={[{ id: 'source', name: 'Ví nguồn', initialBalance: 100000 }, { id: 'target', name: 'Ví đích', initialBalance: 0 }]}
      onClose={vi.fn()}
      onSave={onSave}
      loading={false}
    />,
  );

  const selects = screen.getAllByRole('combobox');
  act(() => fireEvent.change(selects[0], { target: { value: 'source' } }));
  act(() => fireEvent.change(selects[1], { target: { value: 'target' } }));
  act(() => fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50000' } }));
  act(() => fireEvent.click(screen.getByRole('button', { name: /Chuyển tiền/ })));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ sourceWalletId: 'source', destinationWalletId: 'target', amount: 50000 }));
});
