import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import PageHeader from './PageHeader';

const meta = {
  title: 'Components/Common/PageHeader',
  component: PageHeader,
  args: { eyebrow: 'Giao dịch', title: 'Quản lý giao dịch', description: 'Theo dõi toàn bộ thu nhập và chi tiêu của bạn.' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithAction: Story = { args: { actions: <button className="app-primary-button"><Plus size={16} /> Thêm mới</button> } };
export const WithoutEyebrow: Story = { args: { eyebrow: undefined } };
