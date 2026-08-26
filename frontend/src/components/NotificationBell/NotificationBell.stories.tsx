import type { Meta, StoryObj } from '@storybook/react-vite';
import NotificationBell from './NotificationBell';

const meta = {
  title: 'Components/Navigation/NotificationBell',
  component: NotificationBell,
  decorators: [(Story) => <div className="flex justify-end rounded-xl bg-slate-900 p-6"><Story /></div>],
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
