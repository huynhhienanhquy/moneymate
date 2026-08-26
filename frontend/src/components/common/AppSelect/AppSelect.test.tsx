import { render, screen } from '@/test/render';
import AppSelect from './AppSelect';

it('renders options and forwards selection props', () => {
  render(<AppSelect aria-label="Loại ví" defaultValue="BANK"><option value="CASH">Tiền mặt</option><option value="BANK">Ngân hàng</option></AppSelect>);
  expect(screen.getByRole('combobox')).toHaveValue('BANK');
  expect(screen.getByRole('combobox')).toHaveClass('app-select');
});
