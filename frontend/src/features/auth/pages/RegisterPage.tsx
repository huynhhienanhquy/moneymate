import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, User, WalletCards } from 'lucide-react';
import api from '@/shared/api/client';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const change = (e: React.ChangeEvent<HTMLInputElement>) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(''); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) return setError('Vui lòng điền đầy đủ thông tin.');
    if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
    if (form.password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    setLoading(true);
    try { await api.post('/auth/register', { fullName: form.fullName, email: form.email.trim().toLowerCase(), password: form.password }); setSuccess(true); setTimeout(() => navigate('/login'), 2000); }
    catch (err: any) { setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };
  const field = (id: string, label: string, name: keyof typeof form, placeholder: string, icon: React.ReactNode, type = 'text') => <label className="auth-field" htmlFor={id}><span>{label}</span><span className="auth-input-wrap">{icon}<input id={id} name={name} type={type} autoComplete={name === 'email' ? 'email' : name === 'fullName' ? 'name' : 'new-password'} value={form[name]} onChange={change} placeholder={placeholder} />{name === 'password' && <button type="button" className="auth-eye" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>}</span></label>;
  return <main className="auth-page auth-page-register"><div className="auth-scene" aria-hidden="true"><span>₫</span><span>↗</span><span>✦</span><span>●</span><span>▥</span><span>₫</span><span>+</span></div><section className="auth-wrap animate-scale-in" aria-labelledby="register-title"><div className="auth-card"><div className="auth-brand"><WalletCards aria-hidden="true" /><span>MoneyMate</span></div><h1 id="register-title" className="auth-title">Tạo tài khoản</h1><p className="auth-subtitle">Bắt đầu hành trình tài chính thông minh của bạn</p>{error && <div role="alert" className="auth-alert">{error}</div>}{success && <div role="status" className="auth-alert auth-success"><CheckCircle2 size={17} /> Đăng ký thành công! Đang chuyển trang...</div>}<form onSubmit={submit} className="auth-form">{field('register-name', 'Họ và tên', 'fullName', 'Nhập họ và tên của bạn', <User size={19} />)}{field('register-email', 'Email', 'email', 'Nhập địa chỉ email của bạn', <Mail size={19} />, 'email')}{field('register-password', 'Mật khẩu', 'password', 'Tối thiểu 8 ký tự', <LockKeyhole size={19} />, showPassword ? 'text' : 'password')}{field('register-confirm', 'Xác nhận mật khẩu', 'confirmPassword', 'Nhập lại mật khẩu', <LockKeyhole size={19} />, showPassword ? 'text' : 'password')}<button id="register-submit" type="submit" disabled={loading || success} className="auth-submit">{loading ? <Loader2 size={18} className="animate-spin" /> : <>Đăng ký <ArrowRight size={18} /></>}</button></form><p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></div><footer className="auth-footer"><strong>MoneyMate</strong><nav aria-label="Liên kết chân trang"><a href="#terms">Điều khoản</a><a href="#privacy">Bảo mật</a><a href="#contact">Liên hệ</a></nav><p>© 2024 MoneyMate - Hành trình tài chính thông minh</p></footer></section></main>;
};
export default RegisterPage;
