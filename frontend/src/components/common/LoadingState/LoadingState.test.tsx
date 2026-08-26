import { render, screen } from '@/test/render';
import LoadingState from './LoadingState';

describe('LoadingState', () => {
  it('exposes an accessible loading status and custom class', () => {
    render(<LoadingState className="compact" />);
    expect(screen.getByRole('status')).toHaveClass('compact');
    expect(screen.getByLabelText('Đang tải')).toBeInTheDocument();
  });
});
