import type { Meta, StoryObj } from '@storybook/react-vite';
import AppCard from './AppCard';

const meta = { title: 'Components/Common/AppCard', component: AppCard, args: { children: 'Nội dung thẻ' } } satisfies Meta<typeof AppCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Interactive: Story = { args: { interactive: true } };
export const Compact: Story = { args: { padding: 'sm' } };
