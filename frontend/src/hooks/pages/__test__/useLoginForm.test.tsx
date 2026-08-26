import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import '@/test/hookTestMocks';
import { useLoginForm } from '../useLoginForm';

const Harness = () => {
  const form = useLoginForm();
  return <form onSubmit={form.submit}><input aria-label="email" name="email" value={form.form.email} onChange={form.change} /><input aria-label="password" name="password" value={form.form.password} onChange={form.change} /><button>login</button><p>{form.error}</p></form>;
};

it('validates required login fields', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await act(async () => { await user.click(screen.getByRole('button', { name: 'login' })); });
  expect(screen.getByText('Vui lòng điền đầy đủ thông tin.')).toBeInTheDocument();
});
