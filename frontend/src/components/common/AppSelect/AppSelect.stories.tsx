import type { Meta, StoryObj } from '@storybook/react-vite';
import AppSelect from './AppSelect';

const meta = { title: 'Components/Common/AppSelect', component: AppSelect } satisfies Meta<typeof AppSelect>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <AppSelect defaultValue="BANK"><option value="CASH">Tiền mặt</option><option value="BANK">Ngân hàng</option></AppSelect> };
