import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, WalletCards } from 'lucide-react';
import api from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/auth.store';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Vui lòng điền đầy đủ thông tin.');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { ...form, email: form.email.trim().toLowerCase(), platform: 'web' });
      const { user, accessToken } = res.data.data;
      login(user, accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  return <main className="auth-page"><div className="auth-scene" aria-hidden="true"><span>₫</span><span>↗</span><span>✦</span><span>●</span><span>▥</span><span>₫</span><span>+</span></div><section className="auth-wrap animate-scale-in" aria-labelledby="login-title">
    <div className="auth-card">
      <div className="auth-brand"><WalletCards aria-hidden="true" /><span>MoneyMate</span></div>
      <h1 id="login-title" className="auth-title">Chào mừng trở lại!</h1>
      <p className="auth-subtitle">Đăng nhập để tiếp tục hành trình tài chính của bạn</p>
      {error && <div role="alert" className="auth-alert">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
        <label className="auth-field" htmlFor="login-email"><span>Email</span><span className="auth-input-wrap"><Mail size={19} aria-hidden="true" /><input id="login-email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="Nhập địa chỉ email của bạn" /></span></label>
        <label className="auth-field" htmlFor="login-password"><span className="auth-label-row"><span>Mật khẩu</span><button type="button" className="auth-forgot">Quên mật khẩu?</button></span><span className="auth-input-wrap"><LockKeyhole size={19} aria-hidden="true" /><input id="login-password" name="login-password-manual" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={(e) => { setForm((prev) => ({ ...prev, password: e.target.value })); setError(''); }} placeholder="Nhập mật khẩu" /><button type="button" className="auth-eye" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
        <button id="login-submit" type="submit" disabled={loading} className="auth-submit">{loading ? <Loader2 size={18} className="animate-spin" /> : <>Đăng nhập <ArrowRight size={18} /></>}</button>
      </form>
      <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </div>
    <footer className="auth-footer"><strong>MoneyMate</strong><nav aria-label="Liên kết chân trang"><a href="#terms">Điều khoản</a><a href="#privacy">Bảo mật</a><a href="#contact">Liên hệ</a></nav><p>© 2024 MoneyMate - Hành trình tài chính thông minh</p></footer>
  </section></main>;
};
export default LoginPage;
