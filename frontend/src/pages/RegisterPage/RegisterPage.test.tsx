import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
  it('renders the registration form and login link', () => {
    renderPage(RegisterPage);
    expect(screen.getByRole('heading', { name: 'Tạo tài khoản' })).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên')).toBeInTheDocument();
    expect(screen.getByLabelText('Xác nhận mật khẩu')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
  });

  it('validates an empty submission', () => {
    renderPage(RegisterPage);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Đăng ký/ })));
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng điền đầy đủ thông tin.');
  });
});
