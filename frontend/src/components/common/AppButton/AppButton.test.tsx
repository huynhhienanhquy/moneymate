import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import AppButton from './AppButton';

describe('AppButton', () => {
  it('renders icons and invokes click', async () => {
    const onClick = vi.fn();
    render(<AppButton leadingIcon={<span>+</span>} onClick={onClick}>Thêm mới</AppButton>);
    await userEvent.setup().click(screen.getByRole('button', { name: /Thêm mới/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables interaction while loading', () => {
    render(<AppButton loading>Lưu</AppButton>);
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
    expect(screen.getByLabelText('Đang xử lý')).toBeInTheDocument();
  });

  it('can preserve page-specific styles without primitive defaults', () => {
    render(<AppButton unstyled className="custom-action">Tùy chỉnh</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-action');
    expect(screen.getByRole('button')).not.toHaveClass('app-primary-button');
  });
});
