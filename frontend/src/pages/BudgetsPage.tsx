import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank, Pencil, Trash2, Loader2, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const BudgetModal: React.FC<{ budget?: any; categories: any[]; month: number; year: number; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({
  budget, categories, month, year, onClose, onSave, loading,
}) => {
  const [form, setForm] = useState({
    categoryId: budget?.categoryId || '',
    amount: budget ? String(budget.amount) : '',
  });

  const expenseCats = categories.filter((c: any) => c.type === 'EXPENSE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{budget ? 'Sửa ngân sách' : 'Thêm ngân sách'}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Tháng {month}/{year}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Danh mục</label>
            <select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100">
              <option value="">Tổng chi tiêu (Global)</option>
              {expenseCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Hạn mức (VND)</label>
            <input type="number" min="0" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm text-slate-500">Hủy</button>
          <button onClick={() => onSave({ categoryId: form.categoryId || null, amount: parseFloat(form.amount), month, year })}
            disabled={loading || !form.amount}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BudgetsPage: React.FC = () => {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => api.get('/budgets', { params: { month, year } }).then(r => r.data.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data),
  });

  const { data: forecast } = useQuery({
    queryKey: ['ai-forecast', month, year],
    queryFn: () => api.get('/ai/budget/forecast', { params: { month, year } }).then(r => r.data.data),
    staleTime: 120_000,
  });

  const forecastMap = Object.fromEntries(
    (forecast?.forecasts || []).map((f: any) => [f.categoryId || 'global', f])
  );

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/budgets', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/budgets/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setEditBudget(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const statusColor = (s: string) =>
    s === 'EXCEEDED' ? 'text-rose-400' : s === 'WARNING' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Ngân sách</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Theo dõi hạn mức chi tiêu hàng tháng</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold">
          <Plus size={16} /> Thêm ngân sách
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={prev} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-400"><ChevronLeft size={18} /></button>
        <span className="font-semibold text-gray-900 dark:text-slate-200">Tháng {MONTHS[month - 1]} {year}</span>
        <button onClick={next} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-400"><ChevronRight size={18} /></button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-slate-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
          <PiggyBank size={48} className="mb-4 opacity-30" />
          <p>Chưa có ngân sách tháng này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b: any) => {
            const fc = forecastMap[b.categoryId || 'global'];
            return (
            <div key={b.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">{b.category?.name || 'Tổng chi tiêu'}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{formatVND(b.amount)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditBudget(b)} className="p-1.5 text-slate-500 hover:text-slate-200"><Pencil size={14} /></button>
                  <button onClick={() => { if (confirm('Xóa ngân sách?')) deleteMutation.mutate(b.id); }} className="p-1.5 text-slate-500 hover:text-rose-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${b.status === 'EXCEEDED' ? 'bg-rose-500' : b.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Đã chi: {formatVND(b.spent)}</span>
                <span className={`font-semibold flex items-center gap-1 ${statusColor(b.status)}`}>
                  {b.status !== 'OK' && <AlertTriangle size={12} />}
                  {b.percentage}%
                </span>
              </div>
              {fc && fc.severity !== 'OK' && (
                <p className="text-xs mt-2 text-amber-400/80 border-t border-gray-100 dark:border-slate-800 pt-2">
                  🤖 {fc.message}
                </p>
              )}
            </div>
          );})}
        </div>
      )}

      {showModal && <BudgetModal categories={categories} month={month} year={year} onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editBudget && <BudgetModal budget={editBudget} categories={categories} month={month} year={year} onClose={() => setEditBudget(null)} onSave={(d) => updateMutation.mutate({ id: editBudget.id, data: { categoryId: d.categoryId, amount: d.amount } })} loading={updateMutation.isPending} />}
    </div>
  );
};

export default BudgetsPage;
