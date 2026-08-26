import AppButton from '@/components/common/AppButton/AppButton';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, User } from 'lucide-react';
import AuthField from '@/components/Auth/AuthField';
import AuthShell from '@/components/Auth/AuthShell';
import { useRegisterForm } from '@/hooks/pages/useRegisterForm';

const RegisterPage: React.FC = () => {
  const { form, showPassword, setShowPassword, loading, error, success, change, submit } = useRegisterForm();
  return (
    <AuthShell titleId="register-title" register>
      <h1 id="register-title" className="auth-title">Tạo tài khoản</h1>
      <p className="auth-subtitle">Bắt đầu hành trình tài chính thông minh của bạn</p>
      {error && <div role="alert" className="auth-alert">{error}</div>}
      {success && <div role="status" className="auth-alert auth-success"><CheckCircle2 size={17} /> Đăng ký thành công! Đang chuyển trang...</div>}
      <form onSubmit={submit} className="auth-form">
        <AuthField id="register-name" name="fullName" label="Họ và tên" icon={<User size={19} />} autoComplete="name" value={form.fullName} onChange={change} placeholder="Nhập họ và tên của bạn" />
        <AuthField id="register-email" name="email" label="Email" icon={<Mail size={19} />} type="email" autoComplete="email" value={form.email} onChange={change} placeholder="Nhập địa chỉ email của bạn" />
        <AuthField id="register-password" name="password" label="Mật khẩu" icon={<LockKeyhole size={19} />} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={change} placeholder="Tối thiểu 8 ký tự" trailing={<AppButton unstyled type="button" className="auth-eye" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</AppButton>} />
        <AuthField id="register-confirm" name="confirmPassword" label="Xác nhận mật khẩu" icon={<LockKeyhole size={19} />} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={change} placeholder="Nhập lại mật khẩu" />
        <AppButton unstyled id="register-submit" type="submit" disabled={loading || success} className="auth-submit">{loading ? <Loader2 size={18} className="animate-spin" /> : <>Đăng ký <ArrowRight size={18} /></>}</AppButton>
      </form>
      <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </AuthShell>
  );
};

export default RegisterPage;
