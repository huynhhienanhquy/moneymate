import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowRightLeft, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, Download, Loader2, LogOut, Mail, PencilLine, Search, Settings, ShieldCheck, UserPlus, Users, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppButton from '@/components/common/AppButton/AppButton';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';
import UserModal, { type UserForm } from './UserModal';
import { avatarColor, exportUsers, type AdminUser } from './adminUsers';

const PAGE_SIZE = 6;
type RoleFilter = 'ALL' | 'USER' | 'ADMIN';
const EMPTY_USERS: AdminUser[] = [];

export default function AdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useAuthStore((state) => state.user);
  const searchInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [nameSort, setNameSort] = useState<'none' | 'ascending' | 'descending'>('none');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<AdminUser | 'create' | null>(null);
  const [formError, setFormError] = useState('');
  const { data: users = EMPTY_USERS, isLoading, isError, refetch } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'], queryFn: () => api.get('/admin/users').then((response) => response.data.data),
  });
  const closeModal = () => { setModal(null); setFormError(''); };
  const onSuccess = () => { void qc.invalidateQueries({ queryKey: ['admin-users'] }); closeModal(); };
  const onError = () => setFormError('Không thể lưu thay đổi. Kiểm tra thông tin, email trùng hoặc kết nối rồi thử lại.');
  const saveMutation = useMutation({
    mutationFn: async ({ user, form }: { user: AdminUser | 'create'; form: UserForm }) => {
      if (user === 'create') await api.post('/auth/register', { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
      else await api.put(`/admin/users/${user.id}`, { fullName: form.fullName.trim(), role: form.role });
    },
    onSuccess, onError,
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/admin/users/${id}`), onSuccess, onError });
  const pending = saveMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!modal && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); searchInput.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      admins: users.filter((user) => user.role === 'ADMIN').length,
      transactions: users.reduce((sum, user) => sum + user._count.transactions, 0),
      wallets: users.reduce((sum, user) => sum + user._count.wallets, 0),
      newUsers: users.filter((user) => {
        const date = new Date(user.createdAt);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
    };
  }, [users]);
  const filtered = useMemo(() => users.filter((user) => {
    const matchesSearch = `${user.fullName} ${user.email} ${user.role} ${user.id}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'));
    return matchesSearch && (role === 'ALL' || user.role === role);
  }).sort((a, b) => {
    const order = a.fullName.localeCompare(b.fullName, 'vi') || a.id.localeCompare(b.id);
    // Initially retain the API's newest-first order; the member header enables name sorting.
    return nameSort === 'none' ? 0 : nameSort === 'ascending' ? order : -order;
  }), [users, search, role, nameSort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  const openModal = (value: AdminUser | 'create') => { setFormError(''); setModal(value); };
  const handleLogout = async () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) return;
    try { await api.post('/auth/logout'); }
    finally { logout(); qc.clear(); navigate('/login', { replace: true }); }
  };
  const unavailable = isLoading || isError;
  const metric = (value: number) => unavailable ? '—' : value.toLocaleString('vi-VN');

  return (
    <main className="min-h-screen bg-panel-subtle px-4 py-7 text-slate-900 sm:px-7 dark:bg-slate-950 dark:text-slate-100">
      <section className="mx-auto max-w-admin">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-page-title font-extrabold tracking-tight">Quản lý người dùng</h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-badge font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">{metric(users.length)} tài khoản</span>
            </div>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">Xem thông tin, phân quyền vai trò và quản lý tài khoản toàn hệ thống ví MoneyMate.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AppButton unstyled onClick={() => exportUsers(filtered)} disabled={unavailable || !filtered.length} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-caption font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Download className="size-3.5" />Xuất danh sách</AppButton>
            <AppButton unstyled onClick={() => openModal('create')} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-caption font-semibold text-white shadow-sm transition hover:bg-blue-700"><UserPlus className="size-3.5" />Thêm người dùng</AppButton>
            <AppButton unstyled onClick={handleLogout} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-caption font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10"><LogOut className="size-3.5" />Đăng xuất</AppButton>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard title="Tổng tài khoản" value={metric(users.length)} icon={<Users className="size-5" />} tone="blue" description={<><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">+{metric(stats.newUsers)} mới</span><span>trong tháng này</span></>} />
          <StatCard title="Quản trị viên (Admin)" value={metric(stats.admins)} icon={<ShieldCheck className="size-5" />} tone="violet" description={<><span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">Quyền quản trị</span><span>quản lý hệ thống</span></>} />
          <StatCard title="Tổng giao dịch ghi nhận" value={metric(stats.transactions)} icon={<ArrowRightLeft className="size-5" />} tone="amber" description={<span>Tổng cộng {metric(stats.wallets)} ví tiền</span>} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="relative block w-full sm:w-2/5">
            <span className="sr-only">Tìm kiếm người dùng</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input ref={searchInput} type="search" value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Tìm kiếm theo tên, email, vai trò..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-12 text-xs outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-900" />
            {search ? <AppButton unstyled aria-label="Xóa từ khóa tìm kiếm" onClick={() => changeSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="size-3.5" /></AppButton> : <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-100 px-1 text-badge text-slate-400 dark:border-slate-700 dark:bg-slate-800">⌘K</kbd>}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Lọc theo vai trò" className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {([{ value: 'ALL', label: 'Tất cả' }, { value: 'USER', label: `User (${metric(users.length - stats.admins)})` }, { value: 'ADMIN', label: `Admin (${metric(stats.admins)})` }] as const).map((option) => <AppButton unstyled key={option.value} aria-pressed={role === option.value} onClick={() => { setRole(option.value); setPage(1); }} className={`rounded-md px-3 py-1.5 text-badge font-medium transition ${role === option.value ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500 hover:text-blue-600 dark:text-slate-400'}`}>{option.label}</AppButton>)}
            </div>
            <p aria-live="polite" className="border-l border-slate-200 pl-3 text-badge text-slate-500 dark:border-slate-700 dark:text-slate-400">Hiển thị: <span className="text-slate-700 dark:text-slate-200">{metric(filtered.length)} người dùng</span></p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isLoading ? <div role="status" className="flex min-h-72 items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="size-5 animate-spin text-blue-600" />Đang tải dữ liệu...</div>
            : isError ? <div role="alert" className="flex min-h-72 flex-col items-center justify-center gap-4 text-sm"><p>Không thể tải danh sách người dùng.</p><AppButton size="sm" onClick={() => void refetch()}>Thử lại</AppButton></div>
            : <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-admin-table table-fixed text-left">
                  <caption className="sr-only">Danh sách người dùng</caption>
                  <thead className="bg-slate-50/80 text-badge font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400"><tr>
                    <th scope="col" aria-sort={nameSort} className="w-admin-member px-5 py-4"><AppButton unstyled onClick={() => { setNameSort(nameSort === 'ascending' ? 'descending' : 'ascending'); setPage(1); }} className="inline-flex items-center gap-1 uppercase" aria-label="Sắp xếp theo thành viên">Thành viên{nameSort === 'ascending' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}</AppButton></th>
                    <th scope="col" className="w-admin-email px-3 py-4">Email</th>
                    <th scope="col" className="w-admin-role px-2 py-4 text-center">Vai trò</th>
                    <th scope="col" className="w-admin-transactions px-2 py-4 text-center">Giao dịch</th>
                    <th scope="col" className="w-admin-wallets px-2 py-4 text-center">Số ví</th>
                    <th scope="col" className="w-admin-date px-3 py-4">Ngày tạo</th>
                    <th scope="col" className="w-admin-actions px-2 py-4 text-center">Thao tác</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pageUsers.map((user) => <tr key={user.id} className="transition-colors even:bg-slate-50/40 hover:bg-blue-50/40 dark:even:bg-slate-800/20 dark:hover:bg-slate-800/60">
                      <td className="px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm ${avatarColor(user.id)}`}>{(user.fullName || user.email).charAt(0).toLocaleUpperCase('vi')}</span><div className="min-w-0"><p className="flex items-center gap-1 text-xs font-semibold"><span className="truncate" title={user.fullName}>{user.fullName}</span>{user.role === 'ADMIN' && <ShieldCheck className="size-3 shrink-0 text-violet-500" />}</p><p className={`mt-1 truncate text-badge ${user.role === 'ADMIN' ? 'text-violet-400' : 'text-slate-400'}`} title={user.id}>{user.role === 'ADMIN' ? 'Quản trị hệ thống' : `ID: ${user.id.slice(0, 8).toUpperCase()}`}</p></div></div></td>
                      <td className="px-3 py-4"><span className="flex items-center gap-1.5 text-caption"><Mail className={`size-3 shrink-0 ${user.role === 'ADMIN' ? 'text-violet-400' : 'text-blue-400'}`} /><span className="truncate" title={user.email}>{user.email}</span></span></td>
                      <td className="px-2 py-4 text-center"><span className={`inline-flex rounded-full px-2.5 py-1 text-badge font-medium ${user.role === 'ADMIN' ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{user.role === 'ADMIN' ? '✦ Admin' : 'User'}</span></td>
                      <td className="px-2 py-4 text-center"><CountBadge icon={<ArrowRightLeft className="size-3" />} value={user._count.transactions} admin={user.role === 'ADMIN'} /></td>
                      <td className="px-2 py-4 text-center"><CountBadge icon={<Wallet className="size-3" />} value={user._count.wallets} admin={user.role === 'ADMIN'} /></td>
                      <td className="px-3 py-4"><span className="inline-flex items-center gap-1.5 whitespace-nowrap text-badge"><CalendarDays className="size-3 text-slate-400" />{new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></td>
                      <td className="px-2 py-4 text-center"><AppButton unstyled onClick={() => openModal(user)} aria-label={`Quản lý ${user.fullName}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10">{user.role === 'ADMIN' ? <Settings className="size-3.5" /> : <PencilLine className="size-3.5" />}</AppButton></td>
                    </tr>)}
                  </tbody>
                </table>
                {!filtered.length && <div className="flex min-h-60 flex-col items-center justify-center gap-2 px-6 text-center"><Users className="mb-2 size-8 text-slate-300" /><p className="text-sm font-semibold">Không tìm thấy người dùng phù hợp</p><p className="text-xs text-slate-400">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p></div>}
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-badge text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Hiển thị {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} của {filtered.length} người dùng</span>
                <nav aria-label="Phân trang người dùng" className="flex items-center gap-1.5">
                  <PageButton label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-3.5" /></PageButton>
                  {pageNumbers.map((number, position) => <span key={number} className="flex items-center gap-1.5">{position > 0 && number - pageNumbers[position - 1] > 1 && <span aria-hidden="true">…</span>}<PageButton label={`Trang ${number}`} active={number === currentPage} onClick={() => setPage(number)}>{number}</PageButton></span>)}
                  <PageButton label="Trang sau" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight className="size-3.5" /></PageButton>
                </nav>
              </footer>
            </>}
        </div>
      </section>
      {modal && <UserModal key={modal === 'create' ? 'create' : modal.id} user={modal === 'create' ? undefined : modal} ownAccount={modal !== 'create' && modal.id === currentUser?.id} error={formError} loading={pending} onClose={() => { if (!pending) closeModal(); }} onSave={(form) => { setFormError(''); saveMutation.mutate({ user: modal, form }); }} onDelete={() => { if (modal !== 'create' && confirm(`Bạn chắc chắn muốn xóa vĩnh viễn người dùng ${modal.fullName}?`)) { setFormError(''); deleteMutation.mutate(modal.id); } }} />}
    </main>
  );
}

const tones = {
  blue: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300',
  violet: 'bg-violet-50 text-violet-500 dark:bg-violet-500/10 dark:text-violet-300',
  amber: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300',
};
function StatCard({ title, value, description, icon, tone }: { title: string; value: string; description: ReactNode; icon: ReactNode; tone: keyof typeof tones }) {
  return <article className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="pr-10"><h2 className="text-badge font-medium uppercase tracking-wide text-slate-400">{title}</h2><p className={`mt-1.5 text-2xl font-bold ${tone === 'violet' ? 'text-violet-600 dark:text-violet-400' : ''}`}>{value}</p></div><span className={`absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span><p className="mt-2 flex flex-wrap items-center gap-2 text-badge text-slate-400">{description}</p></article>;
}
function CountBadge({ value, icon, admin }: { value: number; icon: ReactNode; admin: boolean }) {
  return <span className={`inline-flex items-center justify-center gap-1 rounded border px-1.5 py-0.5 text-badge ${admin ? 'border-violet-100 bg-violet-50/40 text-violet-500 dark:border-violet-900 dark:bg-violet-500/10' : value ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-500/10 dark:text-blue-300' : 'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'}`}>{icon}{value.toLocaleString('vi-VN')}</span>;
}
function PageButton({ children, label, active, disabled, onClick }: { children: ReactNode; label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return <AppButton unstyled aria-label={label} aria-current={active ? 'page' : undefined} disabled={disabled} onClick={onClick} className={`flex size-8 items-center justify-center rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:hover:bg-slate-800'}`}>{children}</AppButton>;
}
