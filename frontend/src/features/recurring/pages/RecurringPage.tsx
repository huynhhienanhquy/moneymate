import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Pencil, Trash2, Loader2, X, Pause, Play, Calendar, Repeat } from 'lucide-react';
import api from '@/shared/api/client';
import AppModal from '@/shared/components/AppModal';
import LoadingState from '@/shared/components/LoadingState';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Hàng ngày', WEEKLY: 'Hàng tuần', MONTHLY: 'Hàng tháng', YEARLY: 'Hàng năm',
};

const RecurringModal: React.FC<{ item?: any; wallets: any[]; categories: any[]; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({
  item, wallets, categories, onClose, onSave, loading,
}) => {
  const [form, setForm] = useState({
    walletId: item?.walletId || '',
    categoryId: item?.categoryId || '',
    amount: item ? String(item.amount) : '',
    type: item?.type || 'EXPENSE',
    frequency: item?.frequency || 'MONTHLY',
    note: item?.note || '',
    startDate: item ? item.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  const filteredCats = categories.filter((c: any) => c.type === form.type);

  return (
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{item ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            {['INCOME', 'EXPENSE'].map((t) => (
              <button key={t} onClick={() => setForm(p => ({ ...p, type: t, categoryId: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.type === t
                  ? t === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {t === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₫</span>
            <input type="number" min="0" placeholder="Số tiền" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              className="app-input pl-8" />
          </div>
          <select value={form.walletId} onChange={(e) => setForm(p => ({ ...p, walletId: e.target.value }))}
            className="app-select">
            <option value="">-- Chọn ví --</option>
            {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({formatVND(Number(w.initialBalance))})</option>)}
          </select>
          <select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
            className="app-select">
            <option value="">-- Chọn danh mục --</option>
            {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.frequency} onChange={(e) => setForm(p => ({ ...p, frequency: e.target.value }))}
            className="app-select">
            {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))}
            className="app-input" />
          <input type="text" placeholder="Ghi chú (tùy chọn)" value={form.note} onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
            className="app-input" />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="app-secondary-button flex-1">Hủy</button>
          <button onClick={() => onSave({ ...form, amount: parseFloat(form.amount), startDate: new Date(form.startDate) })}
            disabled={loading || !form.walletId || !form.categoryId || !form.amount}
            className="app-primary-button flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Lưu'}
          </button>
        </div>
    </AppModal>
  );
};

const RecurringPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => api.get('/recurring-transactions').then(r => r.data.data),
  });

  const { data: wallets = [] } = useQuery({ queryKey: ['wallets'], queryFn: () => api.get('/wallets').then(r => r.data.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/recurring-transactions', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/recurring-transactions/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring'] }); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recurring-transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/recurring-transactions/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  return (
    <div className="space-y-6">
      <div className="app-page-header">
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Định kỳ</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Giao dịch định kỳ</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lương, hóa đơn, Netflix... tự động mỗi kỳ</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setShowModal(true)} className="app-primary-button">
            <Plus size={16} /><span>Thêm định kỳ</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <div className="app-card flex flex-col items-center py-24 text-slate-500 dark:text-slate-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
            <RefreshCw size={32} className="opacity-40" />
          </div>
          <p className="text-base font-semibold">Chưa có giao dịch định kỳ</p>
          <p className="text-sm mt-1">Tự động hóa các khoản thu chi lặp lại hàng tháng</p>
          <button onClick={() => setShowModal(true)} className="app-primary-button mt-4">
            <Plus size={16} /> Thêm định kỳ
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stagger">
            <div className="app-stat-card app-stat-card-asset">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                  <Repeat size={18} className="text-brand-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng số</p>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{items.length}</p>
            </div>
            <div className="app-stat-card app-stat-card-income">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <RefreshCw size={18} className="text-emerald-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thu nhập định kỳ</p>
              </div>
              <p className="text-2xl font-extrabold text-emerald-500">
                {items.filter((i: any) => i.type === 'INCOME').length}
              </p>
            </div>
            <div className="app-stat-card app-stat-card-expense">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                  <RefreshCw size={18} className="text-rose-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chi tiêu định kỳ</p>
              </div>
              <p className="text-2xl font-extrabold text-rose-500">
                {items.filter((i: any) => i.type === 'EXPENSE').length}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className={`app-card p-4 flex items-center gap-4 transition-all ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${item.type === 'INCOME' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  <RefreshCw size={20} className={item.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{item.note || item.category?.name}</p>
                    <span className={`app-badge ${item.isActive ? 'app-badge-success' : 'app-badge-neutral'}`}>
                      {item.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.category?.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.wallet?.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{FREQ_LABELS[item.frequency]}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar size={11} />
                    Lần tới: {new Date(item.nextExecutionDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <span className={`text-base font-extrabold flex-shrink-0 ${item.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {item.type === 'INCOME' ? '+' : '-'}{formatVND(Number(item.amount))}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleMutation.mutate(item.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={item.isActive ? 'Tạm dừng' : 'Kích hoạt'}>
                    {item.isActive ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => setEditItem(item)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Xóa?')) deleteMutation.mutate(item.id); }}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && <RecurringModal wallets={wallets} categories={categories} onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editItem && <RecurringModal item={editItem} wallets={wallets} categories={categories} onClose={() => setEditItem(null)} onSave={(d) => updateMutation.mutate({ id: editItem.id, data: d })} loading={updateMutation.isPending} />}
    </div>
  );
};

export default RecurringPage;
