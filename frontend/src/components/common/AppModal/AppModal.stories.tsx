import type { Meta, StoryObj } from '@storybook/react-vite';
import AppModal from './AppModal';

const meta = {
  title: 'Components/Common/AppModal',
  component: AppModal,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Thêm giao dịch',
    onClose: () => undefined,
    children: <div className="space-y-3"><label className="block font-semibold">Ghi chú</label><input className="app-input" placeholder="Nhập ghi chú..." /></div>,
    footer: <><button className="app-secondary-button">Hủy</button><button className="app-primary-button">Lưu</button></>,
  },
} satisfies Meta<typeof AppModal>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithoutTitle: Story = { args: { title: undefined } };
