import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/auth.store';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(r => r.data.data),
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName: string; avatarUrl?: string | null }) =>
      api.put('/users/profile', {
        fullName: data.fullName,
        avatarUrl: data.avatarUrl || null,
      }),
    onSuccess: (res) => {
      setUser(res.data.data);
      qc.invalidateQueries({ queryKey: ['profile'] });
      setProfileMsg('Cập nhật hồ sơ thành công!');
      setTimeout(() => setProfileMsg(''), 3000);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/users/change-password', data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMsg('Đổi mật khẩu thành công!');
      setPasswordError('');
      setTimeout(() => setPasswordMsg(''), 3000);
    },
    onError: (err: any) => {
      setPasswordError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
      setPasswordMsg('');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) return;
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Hồ sơ cá nhân</h1>
        <p className="text-slate-400 text-sm mt-0.5">Quản lý thông tin tài khoản và bảo mật</p>
      </div>

      {/* Profile Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <User size={20} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-200">Thông tin cá nhân</h2>
            <p className="text-xs text-slate-500">Email: {profile?.email || user?.email}</p>
          </div>
        </div>

        {profileMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm">
            <CheckCircle2 size={16} />
            {profileMsg}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Họ và tên</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">URL Avatar <span className="text-slate-600">(tùy chọn)</span></label>
            <input
              type="url"
              value={profileForm.avatarUrl}
              onChange={(e) => setProfileForm(p => ({ ...p, avatarUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-semibold transition"
          >
            {updateProfileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu thay đổi
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Lock size={20} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-200">Đổi mật khẩu</h2>
            <p className="text-xs text-slate-500">Bảo vệ tài khoản của bạn</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm">
            <CheckCircle2 size={16} />
            {passwordMsg}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-sm font-semibold transition"
          >
            {changePasswordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
