import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import AppButton from './AppButton';

const meta = { title: 'Components/Common/AppButton', component: AppButton, args: { children: 'Thêm mới' } } satisfies Meta<typeof AppButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = { args: { leadingIcon: <Plus size={16} /> } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const Loading: Story = { args: { loading: true } };
