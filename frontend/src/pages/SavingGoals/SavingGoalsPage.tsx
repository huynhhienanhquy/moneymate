import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Pencil, Trash2, Loader2, X, ArrowDownToLine, ArrowUpFromLine, Trophy, TrendingUp, Calendar } from 'lucide-react';
import api from '@/services/api/client';
import AppModal from '@/components/common/AppModal/AppModal';
import LoadingState from '@/components/common/LoadingState/LoadingState';
import { formatVND } from '@/utils/formatCurrency';
import { useWallets } from '@/hooks/api/useReferenceData';
import PageHeader from '@/components/common/PageHeader/PageHeader';
import SummaryCard from '@/components/common/SummaryCard/SummaryCard';

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

  const { data: wallets = [] } = useWallets();

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

  const totalSaved = goals.reduce((sum: number, goal: any) => sum + Number(goal.currentAmount), 0);
  const completedGoals = goals.filter((goal: any) => goal.status === 'COMPLETED').length;
  const getDaysLeft = (date: string) => Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));

  return (
    <div>
      <PageHeader eyebrow="Mục tiêu" title="Mục tiêu tiết kiệm" description="Theo dõi tiến độ tiết kiệm của bạn" />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={<Target size={18} />} label="Tổng mục tiêu" value={String(goals.length)} tone="blue" />
        <SummaryCard icon={<TrendingUp size={18} />} label="Đã tiết kiệm" value={formatVND(totalSaved)} tone="cyan" />
        <SummaryCard icon={<Trophy size={18} />} label="Hoàn thành" value={`${completedGoals}/${goals.length}`} tone="violet" />
      </div>

      {isLoading ? <div className="mt-5"><LoadingState /></div> : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((g: any) => (
              <div key={g.id} className={`group relative flex min-h-[320px] flex-col rounded-xl border bg-white p-5 shadow-[0_7px_20px_rgba(15,23,42,0.06)] dark:bg-slate-900 ${g.status === 'COMPLETED' ? 'border-violet-200 dark:border-violet-500/25' : 'border-white/80 dark:border-slate-800'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {g.status === 'COMPLETED' ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/15">
                        <Trophy size={18} className="text-violet-600 dark:text-violet-400" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                        <Target size={18} />
                      </div>
                    )}
                    <span className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wide ${g.status === 'COMPLETED' ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' : g.status === 'EXPIRED' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'}`}>
                      {g.status === 'COMPLETED' ? 'Hoàn thành' : g.status === 'EXPIRED' ? 'Hết hạn' : 'Đang tiến hành'}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditGoal(g)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"><Pencil size={13} /></button>
                    <button onClick={() => { if (confirm('Xóa mục tiêu?')) deleteMutation.mutate(g.id); }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h2 className="mt-4 font-extrabold text-slate-950 dark:text-slate-100">{g.title}</h2>
                {g.status === 'COMPLETED' ? (
                  <>
                    <p className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-400"><Calendar size={14} /> Đạt được vào: {new Date(g.targetDate).toLocaleDateString('vi-VN')}</p>
                    <div className="mt-auto pt-8"><p className="text-slate-500 dark:text-slate-400">Tổng cộng</p><p className="mt-1 font-extrabold text-violet-600 dark:text-violet-400">{formatVND(g.currentAmount)}</p><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-500/15"><div className="h-full w-full rounded-full bg-violet-600" /></div></div>
                  </>
                ) : (
                  <>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"><p className="text-slate-500 dark:text-slate-400">Mục tiêu tháng</p><p className="mt-1 font-extrabold text-slate-900 dark:text-white">{formatVND(g.targetAmount)}</p></div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"><p className="text-slate-500 dark:text-slate-400">Còn lại</p><p className="mt-1 font-extrabold text-slate-900 dark:text-white">{getDaysLeft(g.targetDate)} ngày</p></div>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between"><span className="text-slate-500 dark:text-slate-400">Đã góp</span><span className="text-slate-500 dark:text-slate-400">Đích đến</span></div>
                    <div className="flex justify-between"><span className="font-extrabold text-blue-600 dark:text-blue-400">{formatVND(g.currentAmount)}</span><span className="font-bold text-slate-900 dark:text-white">{formatVND(g.targetAmount)}</span></div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, g.progress)}%` }} /></div>
                    <div className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400"><span className="flex items-center gap-1.5"><Calendar size={14} />{new Date(g.targetDate).toLocaleDateString('vi-VN')}</span><span className="font-bold text-blue-600 dark:text-blue-400">{g.progress}%</span></div>
                  </div>
                  <div className="mt-auto flex gap-2 pt-4">
                    <button onClick={() => setAction({ goal: g, type: 'deposit' })}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0873c9] font-semibold text-white transition hover:bg-[#0666b4]">
                      <ArrowDownToLine size={13} /> Nạp
                    </button>
                    <button onClick={() => setAction({ goal: g, type: 'withdraw' })}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
                      <ArrowUpFromLine size={13} /> Rút
                    </button>
                  </div>
                  </>
                )}
              </div>
            ))}
            {/* Add new goal card */}
            <button onClick={() => setShowModal(true)}
              className="group flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white/35 p-5 text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-blue-500 dark:hover:bg-blue-500/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-[0_5px_18px_rgba(15,23,42,0.10)] transition group-hover:scale-105 dark:bg-slate-800 dark:text-blue-400">
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <h2 className="font-extrabold text-slate-900 dark:text-white">Thêm mục tiêu mới</h2>
              <p className="max-w-52 text-center text-slate-500 dark:text-slate-400">Bắt đầu lên kế hoạch cho mục tiêu tiếp theo của bạn</p>
            </button>
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
