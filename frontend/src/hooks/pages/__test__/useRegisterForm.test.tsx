import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import '@/test/hookTestMocks';
import { useRegisterForm } from '../useRegisterForm';

const Harness = () => {
  const form = useRegisterForm();
  return <form onSubmit={form.submit}>{(['fullName', 'email', 'password', 'confirmPassword'] as const).map((name) => <input key={name} aria-label={name} name={name} value={form.form[name]} onChange={form.change} />)}<button>register</button><p>{form.error}</p></form>;
};

it('validates mismatched registration passwords', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await act(async () => {
    await user.type(screen.getByLabelText('fullName'), 'Money Mate');
    await user.type(screen.getByLabelText('email'), 'user@moneymate.vn');
    await user.type(screen.getByLabelText('password'), 'password1');
    await user.type(screen.getByLabelText('confirmPassword'), 'password2');
    await user.click(screen.getByRole('button', { name: 'register' }));
  });
  expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
});
