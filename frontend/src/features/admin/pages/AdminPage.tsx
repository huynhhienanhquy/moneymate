import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2, Loader2, X, ChevronDown, Search, UserCog, LogOut, Mail, Calendar, Wallet, ArrowRightLeft } from 'lucide-react';
import api from '@/shared/api/client';

const AdminPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditUser(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      // Tích hợp logic xóa token của bạn ở đây, ví dụ:
      // localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const filtered = users.filter((u: any) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-slate-100 selection:bg-brand-500/30">

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 bg-clip-text text-transparent">
            Quản lý người dùng
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Xem thông tin, chỉnh sửa vai trò và quản lý trạng thái tài khoản hệ thống.
          </p>
        </div>

        {/* Nút Đăng xuất */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all duration-200 shadow-sm shadow-rose-950/20 group focus:outline-none focus:ring-2 focus:ring-rose-500/40"
        >
          <LogOut size={16} className="transition-transform group-hover:translate-x-0.5" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md group">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email người dùng..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all backdrop-blur-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Hiển thị: <span className="text-slate-300 font-bold">{filtered.length}</span> người dùng
        </div>
      </div>

      {/* MAIN TABLE CONTAINER */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-slate-950/20 backdrop-blur-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-brand-500" />
            <p className="text-xs text-slate-500 tracking-wider font-medium animate-pulse">ĐANG TẢI DỮ LIỆU...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <div className="p-4 bg-slate-800/20 border border-slate-800/40 rounded-2xl mb-4">
              <UserCog size={40} className="opacity-40 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-400">Không tìm thấy người dùng phù hợp</p>
            <p className="text-xs text-slate-600 mt-1">Thử thay đổi từ khóa tìm kiếm của bạn xem sao.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-900/60 text-slate-400 font-medium">
                  <th className="text-xs uppercase tracking-wider px-6 py-4">Thành viên</th>
                  <th className="text-xs uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Email</th>
                  <th className="text-xs uppercase tracking-wider px-4 py-4 hidden md:table-cell">Vai trò</th>
                  <th className="text-xs uppercase tracking-wider px-4 py-4 hidden lg:table-cell text-center">Giao dịch</th>
                  <th className="text-xs uppercase tracking-wider px-4 py-4 hidden lg:table-cell text-center">Ví</th>
                  <th className="text-xs uppercase tracking-wider px-4 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 w-24 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-all duration-150 group">

                    {/* Tên & Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-slate-200 font-bold text-sm border border-slate-700/60 shadow-inner group-hover:border-brand-500/30 transition-colors">
                          {u.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                            {u.fullName}
                            {u.role === 'ADMIN' && (
                              <span title="Quản trị viên" className="inline-flex items-center">
                                <Shield size={13} className="text-amber-400 fill-amber-400/10" />
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-500 sm:hidden mt-0.5">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-600" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700/40'
                      }`}>
                        {u.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>

                    {/* Counts */}
                    <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-slate-400 text-center font-mono">
                      <div className="inline-flex items-center gap-1 justify-center px-2 py-0.5 bg-slate-800/30 border border-slate-800 rounded-md">
                        <ArrowRightLeft size={12} className="text-slate-600" />
                        <span>{u._count?.transactions ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-slate-400 text-center font-mono">
                      <div className="inline-flex items-center gap-1 justify-center px-2 py-0.5 bg-slate-800/30 border border-slate-800 rounded-md">
                        <Wallet size={12} className="text-slate-600" />
                        <span>{u._count?.wallets ?? 0}</span>
                      </div>
                    </td>

                    {/* Ngày tạo */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-600" />
                        <span>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 justify-end">
                        <button
                          onClick={() => setEditUser(u)}
                          title="Chỉnh sửa tài khoản"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/0 hover:border-slate-700 transition-all"
                        >
                          <UserCog size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Bạn chắc chắn muốn xóa vĩnh viễn người dùng ${u.fullName}?`)) deleteMutation.mutate(u.id); }}
                          title="Xóa người dùng"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-rose-500/10 border border-slate-700/0 hover:border-rose-500/20 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(data) => updateMutation.mutate({ id: editUser.id, data })}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
};

const EditUserModal: React.FC<{
  user: any; onClose: () => void; onSave: (d: any) => void; loading: boolean;
}> = ({ user, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    fullName: user.fullName,
    role: user.role,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">

        {/* Glow Decorator */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-brand-400" />
            <h2 className="text-lg font-bold text-slate-100">Cập nhật tài khoản</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Họ và tên</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phân quyền</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full appearance-none px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/40 transition-all pr-10 cursor-pointer"
              >
                <option value="USER">Người dùng hệ thống (User)</option>
                <option value="ADMIN">Quản trị viên tối cao (Admin)</option>
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Info Card inside Modal */}
          <div className="text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-slate-500 font-mono">
            <div className="flex justify-between"><span className="text-slate-600">Email:</span> <span className="text-slate-400">{user.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Ngày gia nhập:</span> <span className="text-slate-400">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span></div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onSave({ fullName: form.fullName, role: form.role })}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-semibold disabled:opacity-60 transition-all shadow-md shadow-brand-950/20 active:scale-[0.98] flex items-center justify-center"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
