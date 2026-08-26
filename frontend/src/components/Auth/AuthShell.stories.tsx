import type { Meta, StoryObj } from '@storybook/react-vite';
import AuthShell from './AuthShell';

const meta = {
  title: 'Components/Auth/AuthShell',
  component: AuthShell,
  parameters: { layout: 'fullscreen' },
  args: { titleId: 'auth-story-title', children: <><h1 id="auth-story-title" className="auth-title">Chào mừng trở lại!</h1><p className="auth-subtitle">Nội dung form được truyền vào qua children.</p></> },
} satisfies Meta<typeof AuthShell>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Login: Story = {};
export const Register: Story = { args: { register: true, children: <><h1 id="auth-story-title" className="auth-title">Tạo tài khoản</h1><p className="auth-subtitle">Bắt đầu hành trình tài chính thông minh.</p></> } };
