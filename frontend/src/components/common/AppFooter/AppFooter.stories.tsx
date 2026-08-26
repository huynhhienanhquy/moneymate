import type { Meta, StoryObj } from '@storybook/react-vite';
import AppFooter from './AppFooter';

const meta = {
  title: 'Components/Common/AppFooter',
  component: AppFooter,
  args: { brand: 'MoneyMate', links: [{ label: 'Điều khoản', href: '#' }, { label: 'Bảo mật', href: '#' }], copyright: '© 2026 MoneyMate' },
} satisfies Meta<typeof AppFooter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
