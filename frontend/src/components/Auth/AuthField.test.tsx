import { Mail } from 'lucide-react';
import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import AuthField from './AuthField';

describe('AuthField', () => {
  it('associates its label and forwards input props', async () => {
    const user = userEvent.setup();
    render(<AuthField id="email" label="Email" icon={<Mail />} placeholder="name@example.com" />);

    const input = screen.getByLabelText('Email');
    await user.type(input, 'user@moneymate.vn');
    expect(input).toHaveValue('user@moneymate.vn');
    expect(input).toHaveAttribute('placeholder', 'name@example.com');
  });

  it('renders label and trailing actions', () => {
    render(<AuthField id="password" label="Mật khẩu" icon={<span>icon</span>} labelAction={<a href="#forgot">Quên mật khẩu?</a>} trailing={<button>Mở</button>} />);
    expect(screen.getByRole('link', { name: 'Quên mật khẩu?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mở' })).toBeInTheDocument();
  });
});
