import { render, screen } from '@/test/render';
import AppLabel from './AppLabel';

it('forwards label props and content', () => {
  render(<AppLabel htmlFor="amount" className="field-label">Số tiền</AppLabel>);
  expect(screen.getByText('Số tiền')).toHaveAttribute('for', 'amount');
  expect(screen.getByText('Số tiền')).toHaveClass('field-label');
});
