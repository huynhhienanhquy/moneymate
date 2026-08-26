import type { Meta, StoryObj } from '@storybook/react-vite';
import LoadingState from './LoadingState';

const meta = { title: 'Components/Common/LoadingState', component: LoadingState } satisfies Meta<typeof LoadingState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Compact: Story = { args: { className: 'py-6' } };
