import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Pencil, Trash2, Loader2, X, ArrowDownToLine, ArrowUpFromLine, Trophy } from 'lucide-react';
import api from '../services/api';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const statusBadge = (s: string) => {
  if (s === 'COMPLETED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (s === 'EXPIRED') return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  return 'bg-brand-500/10 text-brand-400 border-brand-500/30';
};

const GoalModal: React.FC<{ goal?: any; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({ goal, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    title: goal?.title || '',
    targetAmount: goal ? String(goal.targetAmount) : '',
    targetDate: goal ? goal.targetDate.slice(0, 10) : '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{goal ? 'Sửa mục tiêu' : 'Tạo mục tiêu tiết kiệm'}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-300">Tên mục tiêu</label>
            <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Mua laptop mới"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-300">Số tiền mục tiêu</label>
            <input type="number" min="0" value={form.targetAmount} onChange={(e) => setForm(p => ({ ...p, targetAmount: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-slate-300">Ngày đạt mục tiêu</label>
            <input type="date" value={form.targetDate} onChange={(e) => setForm(p => ({ ...p, targetDate: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm text-slate-500">Hủy</button>
          <button onClick={() => onSave({ title: form.title, targetAmount: parseFloat(form.targetAmount), targetDate: new Date(form.targetDate) })}
            disabled={loading || !form.title || !form.targetAmount || !form.targetDate}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DepositModal: React.FC<{ goal: any; wallets: any[]; type: 'deposit' | 'withdraw'; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({
  goal, wallets, type, onClose, onSave, loading,
}) => {
  const [form, setForm] = useState({ walletId: '', amount: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">
          {type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'} – {goal.title}
        </h2>
        <div className="space-y-4">
          <select value={form.walletId} onChange={(e) => setForm(p => ({ ...p, walletId: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100">
            <option value="">-- Chọn ví --</option>
            {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input type="number" min="0" placeholder="Số tiền" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100" />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-500">Hủy</button>
          <button onClick={() => onSave({ walletId: form.walletId, amount: parseFloat(form.amount) })}
            disabled={loading || !form.walletId || !form.amount}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-60">Xác nhận</button>
        </div>
      </div>
    </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Mục tiêu tiết kiệm</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Theo dõi tiến độ tiết kiệm của bạn</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold">
          <Plus size={16} /> Tạo mục tiêu
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-slate-500 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
          <Target size={48} className="mb-4 opacity-30" />
          <p>Chưa có mục tiêu tiết kiệm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g: any) => (
            <div key={g.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {g.status === 'COMPLETED' ? <Trophy size={18} className="text-amber-400" /> : <Target size={18} className="text-brand-400" />}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge(g.status)}`}>
                    {g.status === 'COMPLETED' ? 'Hoàn thành' : g.status === 'EXPIRED' ? 'Hết hạn' : 'Đang tiến hành'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditGoal(g)} className="p-1 text-slate-500 hover:text-slate-200"><Pencil size={13} /></button>
                  <button onClick={() => { if (confirm('Xóa mục tiêu?')) deleteMutation.mutate(g.id); }} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{g.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hạn: {new Date(g.targetDate).toLocaleDateString('vi-VN')}</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-semibold">{formatVND(g.currentAmount)}</span>
                  <span className="text-slate-500">{formatVND(g.targetAmount)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${g.progress}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1 text-right">{g.progress}% hoàn thành</p>
              </div>
              {g.status === 'ACTIVE' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setAction({ goal: g, type: 'deposit' })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    <ArrowDownToLine size={13} /> Nạp
                  </button>
                  <button onClick={() => setAction({ goal: g, type: 'withdraw' })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20">
                    <ArrowUpFromLine size={13} /> Rút
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
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
