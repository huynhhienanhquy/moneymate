import { render, screen } from '@/test/render';
import AppTextarea from './AppTextarea';

it('forwards textarea props', () => {
  render(<AppTextarea aria-label="Ghi chú" defaultValue="Tiền ăn" />);
  expect(screen.getByRole('textbox')).toHaveValue('Tiền ăn');
  expect(screen.getByRole('textbox')).toHaveClass('app-input');
});
