import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mail } from 'lucide-react';
import AppInput from './AppInput';

const meta = { title: 'Components/Common/AppInput', component: AppInput, args: { id: 'email', label: 'Email', placeholder: 'Nhập email' } } satisfies Meta<typeof AppInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithIcon: Story = { args: { leading: <Mail size={16} /> } };
export const Invalid: Story = { args: { error: 'Email không hợp lệ' } };
export const Auth: Story = { args: { variant: 'auth', leading: <Mail size={16} /> } };
