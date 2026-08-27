import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import { getHookMocks } from '@/test/hookTestMocks';
import { useReceiptScanner } from '../useReceiptScanner';

const Harness = () => {
  const receipt = useReceiptScanner();
  return <><button onClick={() => receipt.setFile(new File(['receipt'], 'receipt.png'))}>file</button><button onClick={receipt.scan}>scan</button><button onClick={receipt.reset}>reset</button></>;
};

it('scans a selected receipt and resets it', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await act(async () => { await user.click(screen.getByRole('button', { name: 'file' })); });
  await act(async () => { await user.click(screen.getByRole('button', { name: 'scan' })); });
  expect(getHookMocks().mutate).toHaveBeenCalledWith(expect.any(File));
  await act(async () => { await user.click(screen.getByRole('button', { name: 'reset' })); });
});
