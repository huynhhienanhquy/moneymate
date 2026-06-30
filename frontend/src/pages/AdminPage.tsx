import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2, Loader2, X, ChevronDown, Search, UserCog } from 'lucide-react';
import api from '../services/api';

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

  const filtered = users.filter((u: any) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Quản lý người dùng</h1>
          <p className="text-slate-400 text-sm mt-0.5">Xem, chỉnh sửa và quản lý tất cả tài khoản</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm người dùng..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <UserCog size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy người dùng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-5 py-3.5">Người dùng</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3.5 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3.5 hidden md:table-cell">Vai trò</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3.5 hidden lg:table-cell">Giao dịch</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3.5 hidden lg:table-cell">Ví</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3.5">Ngày tạo</th>
                  <th className="px-4 py-3.5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700">
                          {u.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-slate-200">{u.fullName}</span>
                        {u.role === 'ADMIN' && <Shield size={14} className="text-brand-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-sm text-slate-400">{u.email}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.role === 'ADMIN' ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-slate-500">{u._count?.transactions ?? 0}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-slate-500">{u._count?.wallets ?? 0}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                        <button
                          onClick={() => setEditUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                        >
                          <UserCog size={13} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Xóa người dùng ${u.fullName}?`)) deleteMutation.mutate(u.id); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={13} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-100">Chỉnh sửa người dùng</h2>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Họ tên</label>
            <input
              type="text" value={form.fullName}
              onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Vai trò</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full appearance-none px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition pr-9"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div className="text-xs text-slate-500 border-t border-slate-800 pt-3 mt-2">
            <p>Email: {user.email}</p>
            <p>Ngày tạo: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:bg-slate-800 transition">Hủy</button>
          <button
            onClick={() => onSave({ fullName: form.fullName, role: form.role })}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
