import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Pencil, Trash2, Loader2, X, Pause, Play } from 'lucide-react';
import api from '../services/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{item ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
            {['INCOME', 'EXPENSE'].map((t) => (
              <button key={t} onClick={() => setForm(p => ({ ...p, type: t, categoryId: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${form.type === t
                  ? t === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  : 'text-slate-500'}`}>
                {t === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Số tiền" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
          <select value={form.walletId} onChange={(e) => setForm(p => ({ ...p, walletId: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100">
            <option value="">-- Chọn ví --</option>
            {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100">
            <option value="">-- Chọn danh mục --</option>
            {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.frequency} onChange={(e) => setForm(p => ({ ...p, frequency: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100">
            {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
          <input type="text" placeholder="Ghi chú (tùy chọn)" value={form.note} onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-500">Hủy</button>
          <button onClick={() => onSave({ ...form, amount: parseFloat(form.amount), startDate: new Date(form.startDate) })}
            disabled={loading || !form.walletId || !form.categoryId || !form.amount}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Giao dịch định kỳ</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Lương, hóa đơn, Netflix... tự động mỗi kỳ</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold">
          <Plus size={16} /> Thêm định kỳ
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-slate-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
          <RefreshCw size={48} className="mb-4 opacity-30" />
          <p>Chưa có giao dịch định kỳ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className={`bg-white dark:bg-slate-900 border rounded-xl p-4 flex items-center gap-4 ${item.isActive ? 'border-gray-200 dark:border-slate-800' : 'border-gray-200 dark:border-slate-800 opacity-50'}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${item.type === 'INCOME' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <RefreshCw size={18} className={item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">{item.note || item.category?.name}</p>
                <p className="text-xs text-slate-500">{item.category?.name} · {item.wallet?.name} · {FREQ_LABELS[item.frequency]}</p>
                <p className="text-xs text-slate-500 mt-0.5">Lần tới: {new Date(item.nextExecutionDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.type === 'INCOME' ? '+' : '-'}{formatVND(Number(item.amount))}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggleMutation.mutate(item.id)} className="p-1.5 text-slate-500 hover:text-brand-400">
                  {item.isActive ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={() => setEditItem(item)} className="p-1.5 text-slate-500 hover:text-slate-200"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('Xóa?')) deleteMutation.mutate(item.id); }} className="p-1.5 text-slate-500 hover:text-rose-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <RecurringModal wallets={wallets} categories={categories} onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editItem && <RecurringModal item={editItem} wallets={wallets} categories={categories} onClose={() => setEditItem(null)} onSave={(d) => updateMutation.mutate({ id: editItem.id, data: d })} loading={updateMutation.isPending} />}
    </div>
  );
};

export default RecurringPage;
