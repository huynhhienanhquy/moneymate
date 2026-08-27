import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('renders accessible login fields and registration link', () => {
    renderPage(LoginPage);
    expect(screen.getByRole('heading', { name: 'Chào mừng trở lại!' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByPlaceholderText('Nhập mật khẩu')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Đăng ký ngay' })).toHaveAttribute('href', '/register');
  });

  it('validates an empty submission', () => {
    renderPage(LoginPage);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/ })));
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng điền đầy đủ thông tin.');
  });
});
