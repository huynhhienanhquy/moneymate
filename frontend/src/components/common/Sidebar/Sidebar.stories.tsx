import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

const meta = {
  title: 'Layouts/PageLayout/Sidebar',
  component: Sidebar,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: { user: null, currentPath: '/', theme: 'dark', mobileOpen: false, onMobileOpenChange: () => undefined, onThemeToggle: () => undefined, onLogout: () => undefined },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const MobileOpen: Story = { args: { mobileOpen: true } };
