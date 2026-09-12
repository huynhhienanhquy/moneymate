import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import AppModal from '@/components/common/AppModal/AppModal';
import AppButton from '@/components/common/AppButton/AppButton';
import type { AdminUser } from './adminUsers';

export interface UserForm { fullName: string; email: string; password: string; role: 'USER' | 'ADMIN' }
interface Props {
  user?: AdminUser;
  ownAccount: boolean;
  error: string;
  loading: boolean;
  onClose: () => void;
  onSave: (form: UserForm) => void;
  onDelete: () => void;
}

export default function UserModal({ user, ownAccount, error, loading, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<UserForm>({ fullName: user?.fullName ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'USER' });
  return <AppModal title={user ? 'Cập nhật tài khoản' : 'Thêm người dùng'} onClose={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); if (!loading && !ownAccount) onSave(form); }}>
      <fieldset disabled={loading || ownAccount} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-medium">Họ và tên<input autoFocus required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="app-input mt-1.5" autoComplete="name" /></label>
        <label className="block text-sm font-medium">Email<input required type="email" disabled={!!user} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="app-input mt-1.5 disabled:opacity-60" autoComplete="email" /></label>
        {user ? <label className="block text-sm font-medium">Phân quyền<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserForm['role'] })} className="app-select mt-1.5"><option value="USER">Người dùng (User)</option><option value="ADMIN">Quản trị viên (Admin)</option></select></label>
          : <label className="block text-sm font-medium">Mật khẩu<input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="app-input mt-1.5" autoComplete="new-password" /><span className="mt-1 block text-xs font-normal text-slate-400">Tối thiểu 8 ký tự. Tài khoản mới có vai trò User.</span></label>}
      </fieldset>
      {ownAccount && <p className="mt-4 text-sm text-slate-500">Đây là tài khoản của bạn. Hãy cập nhật thông tin trong phần hồ sơ cá nhân.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-rose-500">{error}</p>}
      <div className="mt-6 flex items-center justify-end gap-3">
        {user && !ownAccount && <AppButton variant="danger" disabled={loading} onClick={onDelete} aria-label="Xóa người dùng" className="mr-auto px-3"><Trash2 className="size-4" /></AppButton>}
        <AppButton variant="secondary" disabled={loading} onClick={onClose}>Đóng</AppButton>
        {!ownAccount && <AppButton type="submit" loading={loading} disabled={!form.fullName.trim()}>{user ? 'Lưu thay đổi' : 'Tạo tài khoản'}</AppButton>}
      </div>
    </form>
  </AppModal>;
}
