import type { Meta, StoryObj } from '@storybook/react-vite';
import ReceiptScanModal from './ReceiptScanModal';

const meta = {
  title: 'Components/Transactions/ReceiptScanModal',
  component: ReceiptScanModal,
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => undefined, onApply: () => undefined },
} satisfies Meta<typeof ReceiptScanModal>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
