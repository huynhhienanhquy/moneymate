import type { Meta, StoryObj } from '@storybook/react-vite';
import AppLabel from './AppLabel';

const meta = { title: 'Components/Common/AppLabel', component: AppLabel, args: { children: 'Tên danh mục', className: 'text-sm font-semibold' } } satisfies Meta<typeof AppLabel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
