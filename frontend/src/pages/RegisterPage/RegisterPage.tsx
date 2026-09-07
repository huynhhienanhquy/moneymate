import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppButton from '@/components/common/AppButton/AppButton';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, User } from 'lucide-react';
import AuthField from '@/components/Auth/AuthField';
import AuthShell from '@/components/Auth/AuthShell';
import { useRegisterForm } from '@/hooks/useRegisterForm';

const RegisterPage: React.FC = () => {
  const { form, showPassword, setShowPassword, loading, error, success, change, submit } = useRegisterForm();
  return (
    <AuthShell titleId="register-title" register>
      <AppTitle unstyled level={1} id="register-title" className="auth-title">Tạo tài khoản</AppTitle>
      <p className="auth-subtitle">Bắt đầu hành trình tài chính thông minh của bạn</p>
      {error && <div role="alert" className="auth-alert">{error}</div>}
      {success && <div role="status" className="auth-alert auth-success"><CheckCircle2 className="size-icon-nav" /> Đăng ký thành công! Đang chuyển trang...</div>}
      <form onSubmit={submit} className="auth-form">
        <AuthField id="register-name" name="fullName" label="Họ và tên" icon={<User className="size-icon-large" />} autoComplete="name" value={form.fullName} onChange={change} placeholder="Nhập họ và tên của bạn" />
        <AuthField id="register-email" name="email" label="Email" icon={<Mail className="size-icon-large" />} type="email" autoComplete="email" value={form.email} onChange={change} placeholder="Nhập địa chỉ email của bạn" />
        <AuthField id="register-password" name="password" label="Mật khẩu" icon={<LockKeyhole className="size-icon-large" />} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={change} placeholder="Tối thiểu 8 ký tự" trailing={<AppButton unstyled type="button" className="auth-eye" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="size-icon-large" /> : <Eye className="size-icon-large" />}</AppButton>} />
        <AuthField id="register-confirm" name="confirmPassword" label="Xác nhận mật khẩu" icon={<LockKeyhole className="size-icon-large" />} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={change} placeholder="Nhập lại mật khẩu" />
        <AppButton unstyled id="register-submit" type="submit" disabled={loading || success} className="auth-submit">{loading ? <Loader2  className="size-4.5 animate-spin" /> : <>Đăng ký <ArrowRight className="size-4.5" /></>}</AppButton>
      </form>
      <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </AuthShell>
  );
};

export default RegisterPage;
