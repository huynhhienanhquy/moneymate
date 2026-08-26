import { render, screen } from '@/test/render';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders optional content and actions', () => {
    render(<PageHeader title="Ví tài khoản" eyebrow="Tổng quan" description="Quản lý các ví" actions={<button>Thêm ví</button>} />);
    expect(screen.getByRole('heading', { name: 'Ví tài khoản' })).toBeInTheDocument();
    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Quản lý các ví')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm ví' })).toBeInTheDocument();
  });
});
