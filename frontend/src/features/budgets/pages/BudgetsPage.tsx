import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank, Pencil, Trash2, Loader2, X, ChevronLeft, ChevronRight, AlertTriangle, TrendingDown, CalendarDays, CircleDollarSign, WalletCards } from 'lucide-react';
import api from '@/shared/api/client';
import AppModal from '@/shared/components/AppModal';
import LoadingState from '@/shared/components/LoadingState';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const ProgressRing = ({ percentage, tone }: { percentage: number; tone: 'safe' | 'warning' | 'danger' }) => {
  const progress = Math.min(100, Math.max(0, Number(percentage) || 0));
  const stroke = tone === 'danger' ? '#ef4444' : tone === 'warning' ? '#f59e0b' : '#10b981';
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-200 dark:text-slate-800" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={stroke} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[18px] font-extrabold text-slate-800 dark:text-slate-100">{Math.round(progress)}%</span>
    </div>
  );
};

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
  const totalRemaining = Math.max(0, totalBudget - totalSpent);

  return (
    <div>
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0567ba] to-[#087bdf] px-5 py-5 text-white shadow-[0_8px_20px_rgba(7,105,190,0.22)] sm:px-7">
        <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-bold uppercase tracking-wide text-blue-100"><CircleDollarSign size={16} /> Quản lý ngân sách</p>
            <h1 className="mt-2 font-extrabold tracking-normal text-white">Ngân sách</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 font-bold text-[#0769be] shadow-md transition hover:bg-blue-50">
            <Plus size={16} /> Thêm Ngân sách
          </button>
        </div>
      </section>

      {/* Period Navigator */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button onClick={prev} aria-label="Tháng trước" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-blue-600 dark:hover:bg-slate-900"><ChevronLeft size={18} /></button>
        <div className="flex h-10 items-center gap-2 rounded-full bg-white px-5 font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
          <CalendarDays size={16} className="text-[#0873c9]" />
          Tháng {month} {year}
        </div>
        <button onClick={next} aria-label="Tháng sau" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-blue-600 dark:hover:bg-slate-900"><ChevronRight size={18} /></button>
      </div>

      {isLoading ? (
        <div className="mt-6"><LoadingState /></div>
      ) : budgets.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-xl bg-white py-20 text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
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
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard icon={<WalletCards size={18} />} label="Tổng ngân sách" value={formatVND(totalBudget)} tone="blue" />
            <SummaryCard icon={<TrendingDown size={18} />} label="Đã chi" value={formatVND(totalSpent)} tone="red" />
            <SummaryCard icon={<PiggyBank size={18} />} label="Còn lại" value={formatVND(totalRemaining)} tone="green" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map((b: any) => {
              const fc = forecastMap[b.categoryId || 'global'];
              const isWarning = b.status === 'WARNING';
              const isExceeded = b.status === 'EXCEEDED';
              const tone = isExceeded ? 'danger' : isWarning ? 'warning' : 'safe';
              return (
              <div key={b.id} className={`group relative overflow-hidden rounded-xl border-t-4 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:bg-slate-900 ${isExceeded ? 'border-rose-500' : isWarning ? 'border-amber-400' : 'border-emerald-400'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ color: b.category?.color || '#0873c9', background: `${b.category?.color || '#0873c9'}18` }}><PiggyBank size={17} /></span>
                    <div><h2 className="truncate font-extrabold text-slate-900 dark:text-slate-100">{b.category?.name || 'Tổng chi tiêu'}</h2><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 font-semibold ${isExceeded ? 'bg-rose-100 text-rose-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{isExceeded ? 'Vượt mức' : isWarning ? 'Sắp chạm mức' : 'Tốt'}</span></div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditBudget(b)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm('Xóa ngân sách?')) deleteMutation.mutate(b.id); }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center"><ProgressRing percentage={b.percentage} tone={tone} /></div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div><p className="text-slate-500 dark:text-slate-400">Đã chi</p><p className="font-bold text-slate-900 dark:text-slate-100">{formatVND(b.spent)}</p></div>
                  <div className="text-right"><p className="text-slate-500 dark:text-slate-400">Hạn mức</p><p className="font-bold text-slate-900 dark:text-slate-100">{formatVND(b.amount)}</p></div>
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
              className="group flex min-h-[310px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white/35 p-5 text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-blue-500 dark:hover:bg-blue-500/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition group-hover:scale-105 dark:bg-blue-500/15 dark:text-blue-400">
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <h2 className="font-extrabold">Thêm ngân sách</h2>
              <p className="max-w-48 text-center text-slate-500 dark:text-slate-400">Tạo danh mục ngân sách mới để theo dõi chi tiêu</p>
            </button>
          </div>
        </>
      )}

      {showModal && <BudgetModal categories={categories} month={month} year={year} onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editBudget && <BudgetModal budget={editBudget} categories={categories} month={month} year={year} onClose={() => setEditBudget(null)} onSave={(d) => updateMutation.mutate({ id: editBudget.id, data: { categoryId: d.categoryId, amount: d.amount } })} loading={updateMutation.isPending} />}
    </div>
  );
};

const SummaryCard = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'blue' | 'red' | 'green' }) => {
  const styles = tone === 'red' ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/15' : tone === 'green' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/15';
  const valueColor = tone === 'red' ? 'text-rose-500' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900 dark:text-white';
  return <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:bg-slate-900"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles}`}>{icon}</span><div className="min-w-0"><p className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p><p className={`truncate font-extrabold ${valueColor}`}>{value}</p></div></div>;
};

export default BudgetsPage;
