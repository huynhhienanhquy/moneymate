import { render, screen } from '@/test/render';
import AppTitle from './AppTitle';

it('renders heading hierarchy and supporting copy', () => {
  render(<AppTitle level={2} eyebrow="Báo cáo" description="Tổng quan tài chính">Thu chi tháng này</AppTitle>);
  expect(screen.getByRole('heading', { level: 2, name: 'Thu chi tháng này' })).toBeInTheDocument();
  expect(screen.getByText('Báo cáo')).toBeInTheDocument();
  expect(screen.getByText('Tổng quan tài chính')).toBeInTheDocument();
});

it('preserves page-specific heading presentation', () => {
  render(<AppTitle unstyled level={2} id="section-title" className="custom-title">Chi tiết</AppTitle>);
  expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'section-title');
  expect(screen.getByRole('heading', { level: 2 })).toHaveClass('custom-title');
});
