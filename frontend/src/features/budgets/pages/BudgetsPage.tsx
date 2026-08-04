import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank, Pencil, Trash2, Loader2, X, ChevronLeft, ChevronRight, AlertTriangle, TrendingDown } from 'lucide-react';
import api from '@/shared/api/client';
import AppModal from '@/shared/components/AppModal';
import LoadingState from '@/shared/components/LoadingState';

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
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{budget ? 'Sửa ngân sách' : 'Thêm ngân sách'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition"><X size={20} /></button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-2.5">
          <PiggyBank size={14} /> Tháng {MONTHS[month - 1]} {year}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Danh mục</label>
            <select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
              className="app-select">
              <option value="">Tổng chi tiêu (Global)</option>
              {expenseCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Hạn mức (VND)</label>
            <input type="number" min="0" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              className="app-input" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="app-secondary-button flex-1">Hủy</button>
          <button onClick={() => onSave({ categoryId: form.categoryId || null, amount: parseFloat(form.amount), month, year })}
            disabled={loading || !form.amount}
            className="app-primary-button flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Lưu'}
          </button>
        </div>
    </AppModal>
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

  const totalBudget = budgets.reduce((s: number, b: any) => s + Number(b.amount), 0);
  const totalSpent = budgets.reduce((s: number, b: any) => s + Number(b.spent), 0);

  return (
    <div className="space-y-6">
      <div className="app-page-header">
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Ngân sách</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Ngân sách</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Theo dõi hạn mức chi tiêu hàng tháng</p>
      </div>

      {/* Period Navigator */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prev} className="app-secondary-button p-2.5">
          <ChevronLeft size={18} />
        </button>
        <div className="app-card flex items-center gap-2 px-5 py-3 font-bold text-slate-900 dark:text-slate-200">
          <PiggyBank size={18} className="text-brand-500" />
          Tháng {MONTHS[month - 1]} {year}
        </div>
        <button onClick={next} className="app-secondary-button p-2.5">
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : budgets.length === 0 ? (
        <div className="app-card flex flex-col items-center py-24 text-slate-500 dark:text-slate-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
            <PiggyBank size={32} className="opacity-40" />
          </div>
          <p className="text-base font-semibold">Chưa có ngân sách tháng này</p>
          <p className="text-sm mt-1">Hãy thêm ngân sách để kiểm soát chi tiêu tốt hơn!</p>
          <button onClick={() => setShowModal(true)} className="app-primary-button mt-4">
            <Plus size={16} /> Thêm ngân sách
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stagger">
            <div className="app-stat-card app-stat-card-asset">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                  <PiggyBank size={18} className="text-brand-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng ngân sách</p>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{formatVND(totalBudget)}</p>
            </div>
            <div className="app-stat-card app-stat-card-expense">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                  <TrendingDown size={18} className="text-rose-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Đã chi</p>
              </div>
              <p className="text-2xl font-extrabold text-rose-500">{formatVND(totalSpent)}</p>
            </div>
            <div className="app-stat-card app-stat-card-savings">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Số danh mục</p>
              </div>
              <p className="text-2xl font-extrabold text-amber-500">{budgets.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b: any) => {
              const fc = forecastMap[b.categoryId || 'global'];
              const isWarning = b.status === 'WARNING';
              const isExceeded = b.status === 'EXCEEDED';
              const barColor = isExceeded ? 'from-rose-500 to-rose-400' : isWarning ? 'from-amber-500 to-amber-400' : 'from-emerald-500 to-emerald-400';
              return (
              <div key={b.id} className={`app-card p-5 group ${isExceeded ? 'border-rose-500/30 dark:border-rose-500/20' : isWarning ? 'border-amber-500/30 dark:border-amber-500/20' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{b.category?.name || 'Tổng chi tiêu'}</p>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{formatVND(b.amount)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditBudget(b)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm('Xóa ngân sách?')) deleteMutation.mutate(b.id); }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-slate-500 dark:text-slate-400">Đã chi: <span className="font-semibold">{formatVND(b.spent)}</span></span>
                  <span className={`font-bold flex items-center gap-1 ${isExceeded ? 'text-rose-500 dark:text-rose-400' : isWarning ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                    {isExceeded || isWarning ? <AlertTriangle size={12} /> : null}
                    {b.percentage}%
                  </span>
                </div>
                {fc && fc.severity !== 'OK' && (
                  <p className="text-xs mt-2 text-amber-500 dark:text-amber-400/80 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
                    <AlertTriangle size={11} /> {fc.message}
                  </p>
                )}
              </div>
            )})}
            {/* Add new budget card */}
            <button onClick={() => setShowModal(true)}
              className="app-card border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 flex flex-col items-center justify-center p-5 gap-2 text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-500/10 transition">
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <p className="text-sm font-semibold">Thêm ngân sách</p>
            </button>
          </div>
        </>
      )}

      {showModal && <BudgetModal categories={categories} month={month} year={year} onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editBudget && <BudgetModal budget={editBudget} categories={categories} month={month} year={year} onClose={() => setEditBudget(null)} onSave={(d) => updateMutation.mutate({ id: editBudget.id, data: { categoryId: d.categoryId, amount: d.amount } })} loading={updateMutation.isPending} />}
    </div>
  );
};

export default BudgetsPage;
