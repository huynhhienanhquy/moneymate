import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import { getHookMocks } from '@/test/hookTestMocks';
import { useRegisterForm } from '../useRegisterForm';

const Harness = () => {
  const form = useRegisterForm();
  return <form onSubmit={form.submit}>{(['fullName', 'email', 'password', 'confirmPassword'] as const).map((name) => <input key={name} aria-label={name} name={name} value={form.form[name]} onChange={form.change} />)}<button>register</button><button type="button" onClick={() => form.setShowPassword(!form.showPassword)}>toggle</button><p>{form.error}</p><output>{String(form.success)}:{String(form.loading)}</output></form>;
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

it('validates short passwords', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await act(async () => {
    await user.type(screen.getByLabelText('fullName'), 'Money Mate');
    await user.type(screen.getByLabelText('email'), 'user@moneymate.vn');
    await user.type(screen.getByLabelText('password'), 'short');
    await user.type(screen.getByLabelText('confirmPassword'), 'short');
    await user.click(screen.getByRole('button', { name: 'register' }));
  });
  expect(screen.getByText('Mật khẩu phải có ít nhất 8 ký tự.')).toBeInTheDocument();
});

it('registers normalized user data', async () => {
  vi.useFakeTimers();
  const mocks = getHookMocks();
  mocks.post.mockResolvedValueOnce({ data: { data: {} } });
  render(<Harness />);
  const fields = ['fullName', 'email', 'password', 'confirmPassword'] as const;
  const values = ['Money Mate', ' USER@Example.COM ', 'password1', 'password1'];
  fields.forEach((field, index) => act(() => { screen.getByLabelText(field).dispatchEvent(new InputEvent('input', { bubbles: true, data: values[index] })); }));
  // fireEvent is used here because fake timers and user-event do not share a clock.
  const { fireEvent } = await import('@testing-library/react');
  fields.forEach((field, index) => act(() => fireEvent.change(screen.getByLabelText(field), { target: { value: values[index] } })));
  await act(async () => fireEvent.submit(screen.getByRole('button', { name: 'register' }).closest('form')!));
  expect(mocks.post).toHaveBeenCalledWith('/auth/register', { fullName: 'Money Mate', email: 'user@example.com', password: 'password1' });
  act(() => vi.runAllTimers());
  expect(mocks.navigate).toHaveBeenCalledWith('/login');
  vi.useRealTimers();
});
