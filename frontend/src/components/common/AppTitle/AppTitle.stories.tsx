import type { Meta, StoryObj } from '@storybook/react-vite';
import AppTitle from './AppTitle';

const meta = { title: 'Components/Common/AppTitle', component: AppTitle, args: { children: 'Ví tài khoản' } } satisfies Meta<typeof AppTitle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PageTitle: Story = { args: { eyebrow: 'Tài chính', description: 'Quản lý tài khoản của bạn.' } };
export const SectionTitle: Story = { args: { level: 2, children: 'Tổng quan tháng' } };
