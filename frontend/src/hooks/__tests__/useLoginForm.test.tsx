import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import { getHookMocks } from '@/test/hookTestMocks';
import { useLoginForm } from '../useLoginForm';

const Harness = () => {
  const form = useLoginForm();
  return <form onSubmit={form.submit}><input aria-label="email" name="email" value={form.form.email} onChange={form.change} /><input aria-label="password" name="password" value={form.form.password} onChange={form.change} /><button>login</button><button type="button" onClick={() => form.setShowPassword(!form.showPassword)}>toggle</button><p>{form.error}</p><output>{String(form.loading)}:{String(form.showPassword)}</output></form>;
};

it('validates required login fields', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await act(async () => { await user.click(screen.getByRole('button', { name: 'login' })); });
  expect(screen.getByText('Vui lòng điền đầy đủ thông tin.')).toBeInTheDocument();
});

it('logs in with normalized credentials and navigates', async () => {
  const user = userEvent.setup();
  const mocks = getHookMocks();
  mocks.post.mockResolvedValueOnce({ data: { data: { user: { id: 'u1' }, accessToken: 'token' } } });
  render(<Harness />);
  await act(async () => {
    await user.type(screen.getByLabelText('email'), ' USER@Example.COM ');
    await user.type(screen.getByLabelText('password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(screen.getByRole('button', { name: 'login' }));
  });
  expect(mocks.post).toHaveBeenCalledWith('/auth/login', expect.objectContaining({ email: 'user@example.com', platform: 'web' }));
  expect(mocks.login).toHaveBeenCalledWith({ id: 'u1' }, 'token');
  expect(mocks.navigate).toHaveBeenCalledWith('/');
});

it('shows API and fallback login errors', async () => {
  const user = userEvent.setup();
  const mocks = getHookMocks();
  mocks.post.mockRejectedValueOnce({ response: { data: { message: 'Sai thông tin' } } });
  render(<Harness />);
  await act(async () => {
    await user.type(screen.getByLabelText('email'), 'a@b.com');
    await user.type(screen.getByLabelText('password'), 'password');
    await user.click(screen.getByRole('button', { name: 'login' }));
  });
  expect(screen.getByText('Sai thông tin')).toBeInTheDocument();
});
