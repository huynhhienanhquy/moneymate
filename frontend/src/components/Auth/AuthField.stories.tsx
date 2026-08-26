import type { Meta, StoryObj } from '@storybook/react-vite';
import { Eye, LockKeyhole, Mail } from 'lucide-react';
import AuthField from './AuthField';

const meta = {
  title: 'Components/Auth/AuthField',
  component: AuthField,
  decorators: [(Story) => <div className="mx-auto max-w-md rounded-2xl bg-white p-8"><Story /></div>],
  args: { label: 'Email', icon: <Mail size={19} />, placeholder: 'Nhập địa chỉ email của bạn' },
} satisfies Meta<typeof AuthField>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Email: Story = {};
export const Password: Story = { args: { label: 'Mật khẩu', icon: <LockKeyhole size={19} />, type: 'password', placeholder: 'Nhập mật khẩu', trailing: <button type="button" className="auth-eye" aria-label="Hiện mật khẩu"><Eye size={19} /></button> } };
export const WithAction: Story = { args: { label: 'Mật khẩu', icon: <LockKeyhole size={19} />, type: 'password', labelAction: <button type="button" className="auth-forgot">Quên mật khẩu?</button> } };
