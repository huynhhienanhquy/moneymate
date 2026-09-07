import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppSelect from '@/components/common/AppSelect/AppSelect';
import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppButton from '@/components/common/AppButton/AppButton';
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Bell, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Loader2, LogOut, Mail, Search, ShieldCheck, Trash2, UserCog, Wallet, X } from 'lucide-react';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 4;

const AdminPage: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<any>(null);
  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/admin/users').then((response) => response.data.data) });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditUser(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditUser(null); },
  });

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user: any) => user.fullName?.toLowerCase().includes(keyword) || user.email?.toLowerCase().includes(keyword));
  }, [search, users]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(currentPage * PAGE_SIZE, filtered.length);
  useEffect(() => setPage(1), [search]);

  const handleLogout = async () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) return;
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      qc.clear();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen border-t border-focus-accent bg-panel-subtle text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-9 items-center justify-end gap-5 border-b border-slate-200 bg-white px-3 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <AppButton unstyled type="button" aria-label="Thông báo" className="transition hover:text-slate-900 dark:hover:text-white"><Bell className="size-3.5" /></AppButton>
        <AppButton unstyled type="button" aria-label="Trợ giúp" className="transition hover:text-slate-900 dark:hover:text-white"><CircleHelp className="size-3.5" /></AppButton>
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-micro font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">MM</span>
      </div>

      <main className="admin-page-content px-6 pb-10 pt-5">
      <section className="mx-auto w-full max-w-content">
      <header className="flex items-end justify-between gap-4">
        <div>
          <AppTitle unstyled level={1} className="text-hero-title font-extrabold leading-none tracking-hero text-black dark:text-white">Quản lý người dùng</AppTitle>
          <p className="mt-1.5 text-caption text-slate-700 dark:text-slate-400">Xem thông tin, chỉnh sửa vai trò và quản lý trạng thái tài khoản hệ thống.</p>
        </div>
        <AppButton unstyled type="button" onClick={handleLogout} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-rose-400 bg-white px-3 text-badge font-semibold text-rose-500 transition hover:bg-rose-50 dark:border-rose-500/40 dark:bg-slate-900 dark:hover:bg-rose-500/10">
          <LogOut className="size-3" />Đăng xuất
        </AppButton>
      </header>

      <div className="mt-5 flex h-control-compact items-center justify-between gap-4 rounded-md bg-white px-2.5 shadow-toolbar dark:bg-slate-900">
        <AppLabel className="relative block w-filter-panel sm:w-filter-wide">
          <span className="sr-only">Tìm kiếm người dùng</span>
          <Search  className="size-icon-caption absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
          <AppInput unstyled type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm theo tên hoặc email người dùng..." className="h-7 w-full rounded border border-slate-300 bg-white pl-7 pr-7 text-badge text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          {search && <AppButton unstyled type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="size-icon-small" /></AppButton>}
        </AppLabel>
        <p className="shrink-0 text-mini font-medium text-slate-700 dark:text-slate-400">Hiển thị: <strong className="font-bold text-slate-950 dark:text-slate-100">{filtered.length}</strong> người dùng</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-md bg-white shadow-table dark:bg-slate-900">
        {isLoading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-slate-500"><Loader2  className="size-icon-title animate-spin text-blue-600" /><p className="text-xs font-bold uppercase tracking-widest">Đang tải dữ liệu...</p></div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800"><UserCog className="size-8" /></div><p className="font-semibold text-slate-700 dark:text-slate-200">Không tìm thấy người dùng phù hợp</p><p className="mt-1 text-sm text-slate-500">Hãy thử một tên hoặc địa chỉ email khác.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-table-compact table-fixed border-collapse text-left">
              <thead className="bg-panel-muted dark:bg-slate-950/50"><tr className="text-micro font-bold uppercase tracking-wide text-slate-700 dark:text-slate-400"><th className="w-admin-member px-3 py-3">Thành viên</th><th className="w-admin-email px-2 py-3">Email</th><th className="w-admin-role px-2 py-3">Vai trò</th><th className="w-admin-transactions px-1 py-3 text-center">Giao<br />dịch</th><th className="w-admin-wallets px-1 py-3 text-center">Ví</th><th className="w-admin-date px-2 py-3">Ngày tạo</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageUsers.map((user: any) => (
                  <tr key={user.id} className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5"><AppButton unstyled type="button" onClick={() => setEditUser(user)} className="flex items-center gap-2 text-left" title="Chỉnh sửa tài khoản"><span className="flex h-icon-medium w-icon-medium shrink-0 items-center justify-center rounded-full bg-hero-dark text-mini font-extrabold text-white">{user.fullName?.[0]?.toUpperCase() || '?'}</span><span className="line-clamp-3 text-tiny font-semibold leading-micro text-slate-950 group-hover:text-blue-700 dark:text-slate-100">{user.fullName}{user.role === 'ADMIN' && <ShieldCheck  className="size-2 ml-0.5 inline text-blue-600" />}</span></AppButton></td>
                    <td className="truncate whitespace-nowrap px-2 py-2.5 text-mini font-medium text-blue-600 dark:text-blue-400"><span className="inline-flex max-w-full items-center gap-1.5"><Mail  className="size-icon-micro shrink-0" /><span className="truncate">{user.email}</span></span></td>
                    <td className="px-2 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-micro font-semibold ${user.role === 'ADMIN' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>{user.role === 'ADMIN' ? 'Admin' : 'User'}</span></td>
                    <td className="px-1 py-2.5 text-center"><CountBadge icon={<ArrowRightLeft className="size-icon-micro" />} value={user._count?.transactions ?? 0} /></td>
                    <td className="px-1 py-2.5 text-center"><CountBadge icon={<Wallet className="size-icon-micro" />} value={user._count?.wallets ?? 0} /></td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-tiny text-slate-800 dark:text-slate-300"><span className="inline-flex items-center gap-1"><Calendar className="size-icon-micro" />{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-2.5 py-2 text-tiny text-slate-700 dark:border-slate-800 dark:text-slate-400">
            <span>Hiển thị {firstResult} - {lastResult} của {filtered.length}</span>
            <nav aria-label="Phân trang người dùng" className="flex items-center gap-1">
              <PageButton label="Trang trước" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="size-icon-small" /></PageButton>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <PageButton key={pageNumber} label={`Trang ${pageNumber}`} active={pageNumber === currentPage} onClick={() => setPage(pageNumber)}>{pageNumber}</PageButton>)}
              <PageButton label="Trang sau" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight className="size-icon-small" /></PageButton>
            </nav>
          </footer>
        )}
      </div>

      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={(data) => updateMutation.mutate({ id: editUser.id, data })} onDelete={() => { if (confirm(`Bạn chắc chắn muốn xóa vĩnh viễn người dùng ${editUser.fullName}?`)) deleteMutation.mutate(editUser.id); }} loading={updateMutation.isPending || deleteMutation.isPending} />}
      </section>
      </main>
    </div>
  );
};

const CountBadge = ({ icon, value }: { icon: React.ReactNode; value: number }) => <span className="inline-flex min-w-counter items-center justify-center gap-1 rounded-sm bg-slate-100 px-1 py-1 text-tiny font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{icon}{value}</span>;

const PageButton = ({ children, label, active = false, disabled = false, onClick }: { children: React.ReactNode; label: string; active?: boolean; disabled?: boolean; onClick: () => void }) => (
  <AppButton unstyled type="button" aria-label={label} aria-current={active ? 'page' : undefined} disabled={disabled} onClick={onClick} className={`flex h-5 min-w-5 items-center justify-center rounded border px-1 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{children}</AppButton>
);

const EditUserModal: React.FC<{ user: any; onClose: () => void; onSave: (data: any) => void; onDelete: () => void; loading: boolean }> = ({ user, onClose, onSave, onDelete, loading }) => {
  const [form, setForm] = useState({ fullName: user.fullName, role: user.role });
  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"><UserCog className="size-icon-large" /></span><AppTitle unstyled level={2} className="text-lg font-bold text-slate-950 dark:text-white">Cập nhật tài khoản</AppTitle></div><AppButton unstyled type="button" aria-label="Đóng" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="size-4.5" /></AppButton></div>
        <div className="space-y-4">
          <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Họ và tên<AppInput unstyled value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} className="app-input mt-1.5" /></AppLabel>
          <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Phân quyền<span className="relative mt-1.5 block"><AppSelect unstyled value={form.role} onChange={(event) => setForm((value) => ({ ...value, role: event.target.value }))} className="app-select appearance-none pr-10"><option value="USER">Người dùng hệ thống (User)</option><option value="ADMIN">Quản trị viên (Admin)</option></AppSelect><ChevronDown  className="size-4 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" /></span></AppLabel>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-950/60 dark:text-slate-400"><p>{user.email}</p><p className="mt-1">Ngày gia nhập: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p></div>
        </div>
        <div className="mt-6 flex items-center gap-3"><AppButton unstyled type="button" onClick={onDelete} disabled={loading} aria-label="Xóa người dùng" className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"><Trash2 className="size-icon-nav" /></AppButton><AppButton unstyled type="button" onClick={onClose} className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Hủy</AppButton><AppButton unstyled type="button" onClick={() => onSave(form)} disabled={loading || !form.fullName.trim()} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{loading ? <Loader2  className="size-4 animate-spin" /> : 'Lưu thay đổi'}</AppButton></div>
      </div>
    </div>
  );
};

export default AdminPage;
