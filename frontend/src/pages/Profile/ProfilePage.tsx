import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppButton from '@/components/common/AppButton/AppButton';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Save, Loader2, CheckCircle2, Shield, Mail, Calendar } from 'lucide-react';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';
import PageHeader from '@/components/common/PageHeader/PageHeader';

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
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <PageHeader eyebrow="Hồ sơ" title="Hồ sơ cá nhân" description="Quản lý thông tin tài khoản và bảo mật" />

      {/* User info card */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:bg-slate-900">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-2xl font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
          {user?.fullName ? user.fullName[0].toUpperCase() : <User size={24} />}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{profile?.fullName || user?.fullName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Mail size={13} /> {profile?.email || user?.email}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              Tham gia: {new Date(profile?.createdAt || Date.now()).toLocaleDateString('vi-VN')}
            </span>
          </div>
          {(user?.role === 'ADMIN' || profile?.role === 'ADMIN') && (
            <span className="inline-flex items-center gap-1 mt-2 app-badge-warning">
              <Shield size={11} /> Quản trị viên
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Profile Info */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-brand-500/10">
            <User size={19} className="text-brand-500" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-slate-100">Thông tin cá nhân</h2>
            <p className="text-slate-500 dark:text-slate-400">Cập nhật tên hiển thị và ảnh đại diện</p>
          </div>
        </div>

        {profileMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm animate-slide-down">
            <CheckCircle2 size={16} />
            {profileMsg}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <AppLabel className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">Họ và tên</AppLabel>
            <AppInput unstyled
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
              className="app-input"
            />
          </div>
          <div>
            <AppLabel className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">URL Avatar <span className="font-normal text-slate-400 dark:text-slate-500">(tùy chọn)</span></AppLabel>
            <AppInput unstyled
              type="url"
              value={profileForm.avatarUrl}
              onChange={(e) => setProfileForm(p => ({ ...p, avatarUrl: e.target.value }))}
              placeholder="https://..."
              className="app-input"
            />
          </div>
          <AppButton unstyled
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="app-primary-button"
          >
            {updateProfileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu thay đổi
          </AppButton>
        </form>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/10">
            <Lock size={19} className="text-rose-500" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-slate-100">Đổi mật khẩu</h2>
            <p className="text-slate-500 dark:text-slate-400">Bảo vệ tài khoản của bạn</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm animate-slide-down">
            <CheckCircle2 size={16} />
            {passwordMsg}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm animate-slide-down">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <AppLabel className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">Mật khẩu hiện tại</AppLabel>
            <AppInput unstyled
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="app-input"
            />
          </div>
          <div>
            <AppLabel className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">Mật khẩu mới</AppLabel>
            <AppInput unstyled
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
              className="app-input"
            />
          </div>
          <div>
            <AppLabel className="mb-1.5 block font-semibold text-slate-700 dark:text-slate-300">Xác nhận mật khẩu mới</AppLabel>
            <AppInput unstyled
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="app-input"
            />
          </div>
          <AppButton unstyled
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="app-danger-button"
          >
            {changePasswordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Đổi mật khẩu
          </AppButton>
        </form>
      </div>
      </div>
    </div>
  );
};

export default ProfilePage;
