import AppCard from '@/components/common/AppCard/AppCard';
import AppButton from '@/components/common/AppButton/AppButton';
import PageHeader from '@/components/common/PageHeader/PageHeader';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, Pencil, Trash2, Loader2, ArrowLeftRight } from 'lucide-react';
import api from '@/services/api/client';
import { formatVND } from '@/utils/formatCurrency';
import TransferModal from './TransferModal/TransferModal';
import WalletModal from './WalletModal/WalletModal';
import { WALLET_TYPES } from './wallets.data';

const WalletsPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editWallet, setEditWallet] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: wallets = [], isLoading, isError, refetch } = useQuery({
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
    onSuccess: () => {
      for (const queryKey of ['wallets', 'dashboard', 'monthly-report', 'yearly-report', 'monthly-trend', 'monthly-balance-v7']) {
        qc.invalidateQueries({ queryKey: [queryKey] });
      }
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => api.post('/transactions/transfer', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setShowTransfer(false); },
  });

  const totalBalance = wallets.reduce((s: number, w: any) => s + Number(w.initialBalance), 0);

  const getWalletMeta = (type: string) => WALLET_TYPES.find(wt => wt.value === type) || WALLET_TYPES[0];
  const walletVisual = (type: string) => ({
    CASH: 'from-emerald-500 to-emerald-800',
    BANK: 'from-blue-500 to-blue-900',
    CREDIT_CARD: 'from-violet-500 to-indigo-900',
    E_WALLET: 'from-pink-500 to-rose-700',
    SAVING: 'from-cyan-500 to-teal-800',
  }[type] || 'from-blue-500 to-indigo-900');

  return (
    <div>
      <PageHeader
        eyebrow="Tài khoản"
        title="Ví tài khoản"
        description={<>Tổng tài sản khả dụng: <span className="font-extrabold text-white">{formatVND(totalBalance)}</span></>}
        actions={(
          <>
            {wallets.length >= 2 && (
              <AppButton unstyled onClick={() => setShowTransfer(true)} className="app-secondary-button">
                <ArrowLeftRight className="size-3" /><span>Chuyển tiền</span>
              </AppButton>
            )}
            <AppButton unstyled id="add-wallet-btn" onClick={() => setShowModal(true)} className="app-primary-button">
              <Plus className="size-3" /><span>Thêm ví</span>
            </AppButton>
          </>
        )}
      />

      {wallets.length > 0 && (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Phân bổ danh mục vốn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100"><Wallet className="size-4 text-blue-600" />Phân bổ danh mục vốn</p>
            <div className="flex flex-wrap gap-2">
              {wallets.map((wallet: any) => {
                const share = totalBalance > 0 ? Math.round(Number(wallet.initialBalance) / totalBalance * 100) : 0;
                return <span key={wallet.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-caption font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{wallet.name} ({share}%)</span>;
              })}
            </div>
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {wallets.map((wallet: any) => <span key={wallet.id} className={`h-full bg-gradient-to-r ${walletVisual(wallet.type)}`} style={{ width: `${totalBalance > 0 ? Math.max(2, Number(wallet.initialBalance) / totalBalance * 100) : 0}%` }} />)}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2  className="size-7 animate-spin text-brand-500" /></div>
      ) : isError ? (
        <AppCard padding="none" className="flex flex-col items-center justify-center gap-3 py-20 text-center" role="alert">
          <p className="font-bold text-rose-600 dark:text-rose-400">Không thể tải danh sách ví</p>
          <p className="text-sm text-slate-500">Dữ liệu ví chưa được tải. Vui lòng thử lại.</p>
          <AppButton onClick={() => void refetch()}>Thử lại</AppButton>
        </AppCard>
      ) : wallets.length === 0 ? (
        <AppCard padding="none" className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Wallet  className="size-12 mb-4 opacity-30" />
          <p className="text-base font-medium">Chưa có ví nào</p>
          <p className="text-sm mt-1">Hãy thêm ví đầu tiên để bắt đầu theo dõi tài chính</p>
        </AppCard>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet: any) => {
            const meta = getWalletMeta(wallet.type);
            const Icon = meta.icon;
            return (
              <div key={wallet.id} className={`group relative flex min-h-[176px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${walletVisual(wallet.type)} p-5 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl`}>
                <span className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-xl" />
                <div className="flex items-start gap-2.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                    <Icon className="size-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-badge font-bold uppercase tracking-wider text-white/65">{meta.label}</p>
                    <p className="mt-1 truncate text-base font-extrabold text-white">{wallet.name}</p>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-0.5 rounded-lg bg-slate-950/20 opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 focus-within:opacity-100">
                    <AppButton unstyled
                      id={`edit-wallet-${wallet.id}`}
                      onClick={() => setEditWallet(wallet)}
                      aria-label={`Chỉnh sửa ví ${wallet.name}`}
                      className="rounded p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                    >
                      <Pencil className="size-icon-tiny" />
                    </AppButton>
                    <AppButton unstyled
                      id={`delete-wallet-${wallet.id}`}
                      onClick={() => { if (confirm(`Xóa ví "${wallet.name}"? Ví sẽ không còn trong tổng tài sản, lịch sử giao dịch vẫn được giữ và giao dịch định kỳ của ví sẽ dừng.`)) { setDeletingId(wallet.id); deleteMutation.mutate(wallet.id); } }}
                      aria-label={`Xóa ví ${wallet.name}`}
                      className="rounded p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                    >
                      {deletingId === wallet.id && deleteMutation.isPending ? <Loader2  className="size-icon-tiny animate-spin" /> : <Trash2 className="size-icon-tiny" />}
                    </AppButton>
                  </div>
                </div>
                <div className="relative mt-auto border-t border-white/15 pt-4">
                  <p className="mb-1 text-caption font-semibold text-white/65">Số dư hiện tại</p>
                  <p className="text-2xl font-extrabold leading-none text-white">
                    {formatVND(Number(wallet.initialBalance))}
                  </p>
                </div>
              </div>
            );
          })}
          <AppButton unstyled aria-label="Tạo ví tài khoản mới" onClick={() => setShowModal(true)} className="group flex min-h-[176px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-white/60 p-5 text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-500">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition group-hover:scale-105"><Plus className="size-6" /></span>
            <span className="font-extrabold text-slate-900 dark:text-white">Tạo ví mới</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Kết nối ngân hàng, tiền mặt hoặc ví điện tử</span>
          </AppButton>
        </div>
      )}

      {deleteMutation.isError && <p role="alert" className="mt-3 text-sm text-rose-600">Không thể xóa ví. Vui lòng thử lại.</p>}

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
