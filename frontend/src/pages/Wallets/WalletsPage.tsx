import AppButton from '@/components/common/AppButton/AppButton';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, CreditCard, Smartphone, PiggyBank, Banknote, Pencil, Trash2, Loader2, X, ArrowLeftRight, ChevronDown } from 'lucide-react';
import api from '@/services/api/client';
import { formatVND } from '@/utils/formatCurrency';

const WALLET_TYPES = [
  { value: 'CASH', label: 'Tiền mặt', icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { value: 'BANK', label: 'Ngân hàng', icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng', icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { value: 'E_WALLET', label: 'Ví điện tử', icon: Smartphone, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { value: 'SAVING', label: 'Tiết kiệm', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

const EMPTY_FORM = { name: '', type: 'CASH', currency: 'VND', initialBalance: 0 };
const EMPTY_TRANSFER = { sourceWalletId: '', destinationWalletId: '', amount: '', note: '', transferDate: new Date().toISOString().slice(0, 10) };

const TransferModal: React.FC<{ wallets: any[]; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({ wallets, onClose, onSave, loading }) => {
  const [form, setForm] = useState(EMPTY_TRANSFER);

  const handleSave = () => {
    if (!form.sourceWalletId || !form.destinationWalletId || !form.amount) return;
    onSave({ ...form, amount: parseFloat(form.amount), transferDate: new Date(form.transferDate) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="app-shell-card w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Chuyển tiền giữa ví</h2>
          <AppButton unstyled onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></AppButton>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Từ ví</label>
            <div className="relative">
              <select value={form.sourceWalletId} onChange={(e) => setForm(p => ({ ...p, sourceWalletId: e.target.value }))}
                className="app-select appearance-none pr-9">
                <option value="">-- Chọn ví nguồn --</option>
                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({formatVND(Number(w.initialBalance))})</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Đến ví</label>
            <div className="relative">
              <select value={form.destinationWalletId} onChange={(e) => setForm(p => ({ ...p, destinationWalletId: e.target.value }))}
                className="app-select appearance-none pr-9">
                <option value="">-- Chọn ví đích --</option>
                {wallets.filter((w: any) => w.id !== form.sourceWalletId).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số tiền</label>
            <input type="number" min="0" step="1000" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              className="app-input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngày chuyển</label>
            <input type="date" value={form.transferDate} onChange={(e) => setForm(p => ({ ...p, transferDate: e.target.value }))}
              className="app-input" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <AppButton unstyled onClick={onClose} className="app-secondary-button flex-1">Hủy</AppButton>
          <AppButton unstyled onClick={handleSave} disabled={loading || !form.sourceWalletId || !form.destinationWalletId || !form.amount}
            className="app-primary-button flex-1">
            {loading && <Loader2 size={16} className="animate-spin" />} Chuyển tiền
          </AppButton>
        </div>
      </div>
    </div>
  );
};

const WalletModal: React.FC<{ wallet?: any; onClose: () => void; onSave: (data: any) => void; loading: boolean }> = ({ wallet, onClose, onSave, loading }) => {
  const [form, setForm] = useState(wallet ? { name: wallet.name, type: wallet.type, currency: wallet.currency, initialBalance: Number(wallet.initialBalance) } : EMPTY_FORM);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="app-shell-card w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">{wallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}</h2>
          <AppButton unstyled onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></AppButton>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên ví</label>
            <input
              id="wallet-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="VD: Tiền mặt, Techcombank..."
              className="app-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại ví</label>
            <div className="grid grid-cols-3 gap-2">
              {WALLET_TYPES.map((wt) => {
                const Icon = wt.icon;
                const selected = form.type === wt.value;
                return (
                  <AppButton unstyled
                    key={wt.value}
                    type="button"
                    id={`wallet-type-${wt.value.toLowerCase()}`}
                    onClick={() => setForm(p => ({ ...p, type: wt.value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${selected ? `${wt.bg} ${wt.color} border-current` : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                  >
                    <Icon size={18} />
                    {wt.label}
                  </AppButton>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số dư ban đầu</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₫</span>
              <input
                id="wallet-balance"
                type="number"
                min="0"
                value={form.initialBalance}
                onChange={(e) => setForm(p => ({ ...p, initialBalance: parseFloat(e.target.value) || 0 }))}
                className="app-input pl-8"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <AppButton unstyled onClick={onClose} className="app-secondary-button flex-1">Hủy</AppButton>
          <AppButton unstyled
            id="wallet-save"
            onClick={() => onSave(form)}
            disabled={loading || !form.name}
            className="app-primary-button flex-1"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {wallet ? 'Lưu thay đổi' : 'Tạo ví'}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

const WalletsPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editWallet, setEditWallet] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.get('/wallets').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/wallets', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/wallets/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setEditWallet(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/wallets/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setDeletingId(null); },
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => api.post('/transactions/transfer', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setShowTransfer(false); },
  });

  const totalBalance = wallets.reduce((s: number, w: any) => s + Number(w.initialBalance), 0);

  const getWalletMeta = (type: string) => WALLET_TYPES.find(wt => wt.value === type) || WALLET_TYPES[0];

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="whitespace-nowrap text-[28px] font-extrabold leading-none tracking-normal text-black dark:text-slate-100">
            <span className="mr-2.5 inline-block">Ví</span>
            <span>tài khoản</span>
          </h1>
          <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">Tổng tài sản: <span className="font-extrabold text-[#0873c9] dark:text-brand-400">{formatVND(totalBalance)}</span></p>
        </div>
        <div className="flex gap-2">
          {wallets.length >= 2 && (
            <AppButton unstyled onClick={() => setShowTransfer(true)} className="inline-flex h-8 items-center gap-2 rounded-md border border-[#0873c9] bg-white px-3 text-[9px] font-bold text-[#0873c9] shadow-sm transition hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800">
              <ArrowLeftRight size={12} /><span>Chuyển tiền</span>
            </AppButton>
          )}
          <AppButton unstyled id="add-wallet-btn" onClick={() => setShowModal(true)} className="inline-flex h-8 items-center gap-2 rounded-md bg-[#00699b] px-3.5 text-[9px] font-bold text-white shadow-[0_3px_8px_rgba(0,105,155,0.25)] transition hover:bg-[#005b87]">
            <Plus size={12} /><span>Thêm ví</span>
          </AppButton>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
      ) : wallets.length === 0 ? (
        <div className="app-card flex flex-col items-center justify-center py-24 text-slate-500">
          <Wallet size={48} className="mb-4 opacity-30" />
          <p className="text-base font-medium">Chưa có ví nào</p>
          <p className="text-sm mt-1">Hãy thêm ví đầu tiên để bắt đầu theo dõi tài chính</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet: any) => {
            const meta = getWalletMeta(wallet.type);
            const Icon = meta.icon;
            return (
              <div key={wallet.id} className="group relative flex min-h-[102px] flex-col rounded-[10px] border border-white/80 bg-white px-3 py-3 shadow-[0_7px_18px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 sm:min-h-[102px]">
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                    <Icon size={14} className={meta.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] font-semibold uppercase leading-[1.4] tracking-wide text-slate-500 dark:text-slate-400">{meta.label}</p>
                    <p className="mt-0.5 truncate py-0.5 text-[12px] font-extrabold leading-[1.35] text-slate-950 dark:text-slate-100">{wallet.name}</p>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-0.5 rounded-md bg-white/90 opacity-0 shadow-sm transition group-hover:opacity-100 focus-within:opacity-100 dark:bg-slate-900/90">
                    <AppButton unstyled
                      id={`edit-wallet-${wallet.id}`}
                      onClick={() => setEditWallet(wallet)}
                      aria-label={`Chỉnh sửa ví ${wallet.name}`}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                    >
                      <Pencil size={11} />
                    </AppButton>
                    <AppButton unstyled
                      id={`delete-wallet-${wallet.id}`}
                      onClick={() => { if (confirm(`Xóa ví "${wallet.name}"?`)) { setDeletingId(wallet.id); deleteMutation.mutate(wallet.id); } }}
                      aria-label={`Xóa ví ${wallet.name}`}
                      className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    >
                      {deletingId === wallet.id && deleteMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    </AppButton>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <p className={`text-[18px] font-extrabold leading-none ${Number(wallet.initialBalance) < 0 ? 'text-rose-500' : 'text-[#00b879]'}`}>
                    {formatVND(Number(wallet.initialBalance))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <WalletModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      )}
      {editWallet && (
        <WalletModal
          wallet={editWallet}
          onClose={() => setEditWallet(null)}
          onSave={(data) => updateMutation.mutate({ id: editWallet.id, data })}
          loading={updateMutation.isPending}
        />
      )}
      {showTransfer && wallets.length >= 2 && (
        <TransferModal
          wallets={wallets}
          onClose={() => setShowTransfer(false)}
          onSave={(data) => transferMutation.mutate(data)}
          loading={transferMutation.isPending}
        />
      )}
    </div>
  );
};

export default WalletsPage;
