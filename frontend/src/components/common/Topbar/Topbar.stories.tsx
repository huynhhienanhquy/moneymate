import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import Topbar from './Topbar';

const meta = {
  title: 'Layouts/PageLayout/Topbar',
  component: Topbar,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: { user: null, theme: 'dark', currentPage: 'Tổng quan', onMenuOpen: () => undefined, onThemeToggle: () => undefined },
} satisfies Meta<typeof Topbar>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
