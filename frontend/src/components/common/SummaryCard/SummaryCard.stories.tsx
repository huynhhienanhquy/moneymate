import type { Meta, StoryObj } from '@storybook/react-vite';
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import SummaryCard from './SummaryCard';

const meta = {
  title: 'Components/Common/SummaryCard',
  component: SummaryCard,
  args: { icon: <PiggyBank size={18} />, label: 'Tiết kiệm', value: '8.718 đ', tone: 'blue' },
} satisfies Meta<typeof SummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Income: Story = { args: { icon: <TrendingUp size={18} />, label: 'Tổng thu nhập', value: '10.898 đ', tone: 'green' } };
export const Expense: Story = { args: { icon: <TrendingDown size={18} />, label: 'Tổng chi tiêu', value: '2.180 đ', tone: 'red' } };
export const WithBadgeAndCaption: Story = { args: { badge: '33%', caption: 'Tăng so với tháng trước' } };
