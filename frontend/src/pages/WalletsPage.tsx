import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, CreditCard, Smartphone, PiggyBank, Banknote, Pencil, Trash2, Loader2, X, ArrowLeftRight, ChevronDown } from 'lucide-react';
import api from '../services/api';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

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
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-100">Chuyển tiền giữa ví</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Từ ví</label>
            <div className="relative">
              <select value={form.sourceWalletId} onChange={(e) => setForm(p => ({ ...p, sourceWalletId: e.target.value }))}
                className="w-full appearance-none px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition pr-9">
                <option value="">-- Chọn ví nguồn --</option>
                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({formatVND(Number(w.initialBalance))})</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Đến ví</label>
            <div className="relative">
              <select value={form.destinationWalletId} onChange={(e) => setForm(p => ({ ...p, destinationWalletId: e.target.value }))}
                className="w-full appearance-none px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition pr-9">
                <option value="">-- Chọn ví đích --</option>
                {wallets.filter((w: any) => w.id !== form.sourceWalletId).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Số tiền</label>
            <input type="number" min="0" step="1000" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ngày chuyển</label>
            <input type="date" value={form.transferDate} onChange={(e) => setForm(p => ({ ...p, transferDate: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition">Hủy</button>
          <button onClick={handleSave} disabled={loading || !form.sourceWalletId || !form.destinationWalletId || !form.amount}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-semibold transition">
            {loading && <Loader2 size={16} className="animate-spin" />} Chuyển tiền
          </button>
        </div>
      </div>
    </div>
  );
};

const WalletModal: React.FC<{ wallet?: any; onClose: () => void; onSave: (data: any) => void; loading: boolean }> = ({ wallet, onClose, onSave, loading }) => {
  const [form, setForm] = useState(wallet ? { name: wallet.name, type: wallet.type, currency: wallet.currency, initialBalance: Number(wallet.initialBalance) } : EMPTY_FORM);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-100">{wallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên ví</label>
            <input
              id="wallet-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="VD: Tiền mặt, Techcombank..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Loại ví</label>
            <div className="grid grid-cols-3 gap-2">
              {WALLET_TYPES.map((wt) => {
                const Icon = wt.icon;
                const selected = form.type === wt.value;
                return (
                  <button
                    key={wt.value}
                    type="button"
                    id={`wallet-type-${wt.value.toLowerCase()}`}
                    onClick={() => setForm(p => ({ ...p, type: wt.value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${selected ? `${wt.bg} ${wt.color} border-current` : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                  >
                    <Icon size={18} />
                    {wt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Số dư ban đầu</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₫</span>
              <input
                id="wallet-balance"
                type="number"
                min="0"
                value={form.initialBalance}
                onChange={(e) => setForm(p => ({ ...p, initialBalance: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition">Hủy</button>
          <button
            id="wallet-save"
            onClick={() => onSave(form)}
            disabled={loading || !form.name}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-semibold transition"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {wallet ? 'Lưu thay đổi' : 'Tạo ví'}
          </button>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Ví tài khoản</h1>
          <p className="text-slate-400 text-sm mt-0.5">Tổng tài sản: <span className="text-brand-400 font-bold">{formatVND(totalBalance)}</span></p>
        </div>
        <div className="flex gap-2">
          {wallets.length >= 2 && (
            <button onClick={() => setShowTransfer(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition">
              <ArrowLeftRight size={16} /><span>Chuyển tiền</span>
            </button>
          )}
          <button id="add-wallet-btn" onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition shadow-md shadow-brand-500/20 active:scale-95">
            <Plus size={16} /><span>Thêm ví</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
      ) : wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600 bg-slate-900 border border-slate-800 rounded-2xl">
          <Wallet size={48} className="mb-4 opacity-30" />
          <p className="text-base font-medium">Chưa có ví nào</p>
          <p className="text-sm mt-1">Hãy thêm ví đầu tiên để bắt đầu theo dõi tài chính</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet: any) => {
            const meta = getWalletMeta(wallet.type);
            const Icon = meta.icon;
            return (
              <div key={wallet.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bg}`}>
                    <Icon size={20} className={meta.color} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      id={`edit-wallet-${wallet.id}`}
                      onClick={() => setEditWallet(wallet)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      id={`delete-wallet-${wallet.id}`}
                      onClick={() => { if (confirm(`Xóa ví "${wallet.name}"?`)) { setDeletingId(wallet.id); deleteMutation.mutate(wallet.id); } }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      {deletingId === wallet.id && deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-400 font-medium">{meta.label}</p>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">{wallet.name}</p>
                  <p className={`text-2xl font-extrabold mt-3 ${Number(wallet.initialBalance) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
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
