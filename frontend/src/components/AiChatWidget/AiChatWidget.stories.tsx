import type { Meta, StoryObj } from '@storybook/react-vite';
import AiChatWidget from './AiChatWidget';

const meta = {
  title: 'Components/AI/AiChatWidget',
  component: AiChatWidget,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AiChatWidget>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
