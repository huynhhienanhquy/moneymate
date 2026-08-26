import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import AppModal from './AppModal';

describe('AppModal', () => {
  it('renders accessible content and closes from its button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AppModal title="Thêm ví" footer={<button>Lưu</button>} onClose={onClose}><p>Nội dung</p></AppModal>);

    expect(screen.getByRole('dialog', { name: 'Thêm ví' })).toBeInTheDocument();
    expect(screen.getByText('Nội dung')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đóng hộp thoại' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on Escape and overlay click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<AppModal onClose={onClose}>Nội dung</AppModal>);
    expect(screen.getByRole('dialog', { name: 'Hộp thoại' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(container.querySelector('.app-modal-overlay') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
