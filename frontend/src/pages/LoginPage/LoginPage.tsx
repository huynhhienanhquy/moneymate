import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppButton from '@/components/common/AppButton/AppButton';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import AuthField from '@/components/Auth/AuthField';
import AuthShell from '@/components/Auth/AuthShell';
import { useLoginForm } from '@/hooks/useLoginForm';

const LoginPage: React.FC = () => {
  const { form, showPassword, setShowPassword, loading, error, change, submit } = useLoginForm();
  return (
    <AuthShell titleId="login-title">
      <AppTitle unstyled level={1} id="login-title" className="auth-title">Chào mừng trở lại!</AppTitle>
      <p className="auth-subtitle">Đăng nhập để tiếp tục hành trình tài chính của bạn</p>
      {error && <div role="alert" className="auth-alert">{error}</div>}
      <form onSubmit={submit} className="auth-form" autoComplete="off">
        <AuthField id="login-email" name="email" label="Email" icon={<Mail size={19} aria-hidden="true" />} type="email" autoComplete="email" value={form.email} onChange={change} placeholder="Nhập địa chỉ email của bạn" />
        <AuthField id="login-password" name="login-password-manual" data-field="password" label="Mật khẩu" icon={<LockKeyhole size={19} aria-hidden="true" />} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={change} placeholder="Nhập mật khẩu" labelAction={<AppButton unstyled type="button" className="auth-forgot">Quên mật khẩu?</AppButton>} trailing={<AppButton unstyled type="button" className="auth-eye" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</AppButton>} />
        <AppButton unstyled id="login-submit" type="submit" disabled={loading} className="auth-submit">{loading ? <Loader2 size={18} className="animate-spin" /> : <>Đăng nhập <ArrowRight size={18} /></>}</AppButton>
      </form>
      <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </AuthShell>
  );
};

export default LoginPage;
