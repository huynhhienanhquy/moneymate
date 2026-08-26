import { render, screen } from '@/test/render';
import AppInput from './AppInput';

it('connects label, hint and validation state to the input', () => {
  render(<AppInput id="amount" label="Số tiền" error="Số tiền không hợp lệ" />);
  expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Số tiền không hợp lệ')).toHaveAttribute('id', 'amount-help');
});

it('supports the auth presentation and adornments', () => {
  render(<AppInput id="email" variant="auth" label="Email" leading={<span>@</span>} trailing={<span>.vn</span>} />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(screen.getByText('@')).toBeInTheDocument();
});
