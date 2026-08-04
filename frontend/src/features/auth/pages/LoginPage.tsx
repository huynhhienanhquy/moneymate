import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
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
    if (!form.email || !form.password) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { user, accessToken } = res.data.data;
      login(user, accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-500/10 dark:bg-brand-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500/10 dark:bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Decorative grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`, backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-md relative animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 mb-4 shadow-xl shadow-brand-500/25 animate-float">
            <TrendingUp size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            MoneyMate
            <Sparkles size={18} className="inline ml-1.5 text-brand-400 -translate-y-0.5" />
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">Quản lý tài chính thông minh</p>
        </div>

        {/* Card */}
        <div className="app-shell-card p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Đăng nhập</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Chào mừng trở lại! Hãy nhập thông tin của bạn.</p>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm animate-slide-down">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="app-input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="app-input pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="app-primary-button w-full py-3"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-semibold transition">
              Đăng ký ngay
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Tài khoản demo: <span className="font-mono text-slate-600 dark:text-slate-400">demo@moneymate.app</span> / <span className="font-mono text-slate-600 dark:text-slate-400">Demo@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
