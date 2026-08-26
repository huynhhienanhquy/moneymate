import type { Meta, StoryObj } from '@storybook/react-vite';
import AppTextarea from './AppTextarea';

const meta = { title: 'Components/Common/AppTextarea', component: AppTextarea, args: { placeholder: 'Nhập ghi chú...' } } satisfies Meta<typeof AppTextarea>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
