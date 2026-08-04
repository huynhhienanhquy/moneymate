import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Pencil, Trash2, Loader2, X, ArrowDownToLine, ArrowUpFromLine, Trophy, TrendingUp, Calendar } from 'lucide-react';
import api from '@/shared/api/client';
import AppModal from '@/shared/components/AppModal';
import LoadingState from '@/shared/components/LoadingState';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const GoalModal: React.FC<{ goal?: any; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({ goal, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    title: goal?.title || '',
    targetAmount: goal ? String(goal.targetAmount) : '',
    targetDate: goal ? goal.targetDate.slice(0, 10) : '',
  });
  return (
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{goal ? 'Sửa mục tiêu' : 'Tạo mục tiêu tiết kiệm'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên mục tiêu</label>
            <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Mua laptop mới"
              className="app-input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số tiền mục tiêu</label>
            <input type="number" min="0" value={form.targetAmount} onChange={(e) => setForm(p => ({ ...p, targetAmount: e.target.value }))}
              className="app-input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngày đạt mục tiêu</label>
            <input type="date" value={form.targetDate} onChange={(e) => setForm(p => ({ ...p, targetDate: e.target.value }))}
              className="app-input" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="app-secondary-button flex-1">Hủy</button>
          <button onClick={() => onSave({ title: form.title, targetAmount: parseFloat(form.targetAmount), targetDate: new Date(form.targetDate) })}
            disabled={loading || !form.title || !form.targetAmount || !form.targetDate}
            className="app-primary-button flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Đang xử lý...' : 'Lưu'}
          </button>
        </div>
    </AppModal>
  );
};

const DepositModal: React.FC<{ goal: any; wallets: any[]; type: 'deposit' | 'withdraw'; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({
  goal, wallets, type, onClose, onSave, loading,
}) => {
  const [form, setForm] = useState({ walletId: '', amount: '' });
  return (
    <AppModal onClose={onClose}>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-4">
          {type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Mục tiêu: <span className="font-semibold text-slate-900 dark:text-slate-200">{goal.title}</span></p>
        <div className="space-y-4">
          <select value={form.walletId} onChange={(e) => setForm(p => ({ ...p, walletId: e.target.value }))}
            className="app-select">
            <option value="">-- Chọn ví --</option>
            {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({formatVND(Number(w.initialBalance))})</option>)}
          </select>
          <input type="number" min="0" placeholder="Số tiền" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
            className="app-input" />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="app-secondary-button flex-1">Hủy</button>
          <button onClick={() => onSave({ walletId: form.walletId, amount: parseFloat(form.amount) })}
            disabled={loading || !form.walletId || !form.amount}
            className="app-primary-button flex-1">Xác nhận</button>
        </div>
    </AppModal>
  );
};

const SavingGoalsPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [action, setAction] = useState<{ goal: any; type: 'deposit' | 'withdraw' } | null>(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['saving-goals'],
    queryFn: () => api.get('/saving-goals').then(r => r.data.data),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.get('/wallets').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/saving-goals', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saving-goals'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/saving-goals/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saving-goals'] }); setEditGoal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/saving-goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saving-goals'] }),
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.post(`/saving-goals/${id}/deposit`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saving-goals'] }); qc.invalidateQueries({ queryKey: ['wallets'] }); setAction(null); },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.post(`/saving-goals/${id}/withdraw`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saving-goals'] }); qc.invalidateQueries({ queryKey: ['wallets'] }); setAction(null); },
  });

  return (
    <div className="space-y-6">
      <div className="app-page-header">
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Mục tiêu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Mục tiêu tiết kiệm</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Theo dõi tiến độ tiết kiệm của bạn</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : goals.length === 0 ? (
        <div className="app-card flex flex-col items-center py-24 text-slate-500 dark:text-slate-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
            <Target size={32} className="opacity-40" />
          </div>
          <p className="text-base font-semibold">Chưa có mục tiêu tiết kiệm nào</p>
          <p className="text-sm mt-1">Hãy tạo mục tiêu đầu tiên để bắt đầu!</p>
          <button onClick={() => setShowModal(true)} className="app-primary-button mt-4">
            <Plus size={16} /> Tạo mục tiêu
          </button>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
            <div className="app-stat-card app-stat-card-asset">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                  <Target size={18} className="text-brand-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng mục tiêu</p>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{goals.length}</p>
            </div>

            <div className="app-stat-card app-stat-card-income">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUp size={18} className="text-emerald-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Đã tiết kiệm</p>
              </div>
              <p className="text-2xl font-extrabold text-emerald-500">{formatVND(goals.reduce((s: number, g: any) => s + Number(g.currentAmount), 0))}</p>
            </div>

            <div className="app-stat-card app-stat-card-savings">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Trophy size={18} className="text-amber-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hoàn thành</p>
              </div>
              <p className="text-2xl font-extrabold text-amber-500">{goals.filter((g: any) => g.status === 'COMPLETED').length}/{goals.length}</p>
            </div>
          </div>

          {/* Goals grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g: any) => (
              <div key={g.id} className="app-card app-card-hover p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {g.status === 'COMPLETED' ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <Trophy size={16} className="text-amber-400" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
                        <Target size={16} className="text-brand-400" />
                      </div>
                    )}
                    <span className={`app-badge ${
                      g.status === 'COMPLETED' ? 'app-badge-success' :
                      g.status === 'EXPIRED' ? 'app-badge-danger' : 'app-badge-info'
                    }`}>
                      {g.status === 'COMPLETED' ? 'Hoàn thành' : g.status === 'EXPIRED' ? 'Hết hạn' : 'Đang tiến hành'}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditGoal(g)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"><Pencil size={13} /></button>
                    <button onClick={() => { if (confirm('Xóa mục tiêu?')) deleteMutation.mutate(g.id); }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{g.title}</h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar size={12} />
                  Hạn: {new Date(g.targetDate).toLocaleDateString('vi-VN')}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-emerald-400 font-bold">{formatVND(g.currentAmount)}</span>
                    <span className="text-slate-500">{formatVND(g.targetAmount)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${g.progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-brand-500 to-cyan-400'}`}
                      style={{ width: `${Math.min(100, g.progress)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-right font-medium">{g.progress}% hoàn thành</p>
                </div>
                {g.status === 'ACTIVE' && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setAction({ goal: g, type: 'deposit' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 hover:bg-emerald-500/20 transition">
                      <ArrowDownToLine size={13} /> Nạp
                    </button>
                    <button onClick={() => setAction({ goal: g, type: 'withdraw' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 hover:bg-rose-500/20 transition">
                      <ArrowUpFromLine size={13} /> Rút
                    </button>
                  </div>
                )}
              </div>
            ))}
            {/* Add new goal card */}
            <button onClick={() => setShowModal(true)}
              className="app-card border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 flex flex-col items-center justify-center p-5 gap-2 text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-500/10 transition">
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <p className="text-sm font-semibold">Thêm mục tiêu</p>
            </button>
          </div>
        </>
      )}

      {showModal && <GoalModal onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editGoal && <GoalModal goal={editGoal} onClose={() => setEditGoal(null)} onSave={(d) => updateMutation.mutate({ id: editGoal.id, data: d })} loading={updateMutation.isPending} />}
      {action && (
        <DepositModal goal={action.goal} wallets={wallets} type={action.type} onClose={() => setAction(null)}
          onSave={(d) => action.type === 'deposit' ? depositMutation.mutate({ id: action.goal.id, data: d }) : withdrawMutation.mutate({ id: action.goal.id, data: d })}
          loading={depositMutation.isPending || withdrawMutation.isPending} />
      )}
    </div>
  );
};

export default SavingGoalsPage;
