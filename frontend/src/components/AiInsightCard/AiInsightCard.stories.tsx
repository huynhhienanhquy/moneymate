import type { Meta, StoryObj } from '@storybook/react-vite';
import AiInsightCard from './AiInsightCard';

const meta = {
  title: 'Components/AI/AiInsightCard',
  component: AiInsightCard,
  args: { type: 'info', title: 'Phân tích tài chính', message: 'Chi tiêu tháng này đang nằm trong kế hoạch.' },
} satisfies Meta<typeof AiInsightCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Positive: Story = { args: { type: 'positive', title: 'Tín hiệu tích cực', message: 'Bạn đã tiết kiệm nhiều hơn tháng trước.' } };
export const Warning: Story = { args: { type: 'warning', title: 'Sắp vượt ngân sách', message: 'Danh mục Ăn uống đã sử dụng 85% hạn mức.' } };
export const Increase: Story = { args: { type: 'increase', title: 'Chi tiêu tăng', message: 'Chi tiêu tăng 12% so với tháng trước.' } };
export const Decrease: Story = { args: { type: 'decrease', title: 'Chi tiêu giảm', message: 'Chi tiêu giảm 8% so với tháng trước.' } };
