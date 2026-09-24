import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppCard from '@/components/common/AppCard/AppCard';
import AppButton from '@/components/common/AppButton/AppButton';
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
          <AppTitle unstyled level={1} className="whitespace-nowrap text-page-title font-extrabold leading-none tracking-normal text-black dark:text-slate-100">
            <span className="mr-2.5 inline-block">Ví</span>
            <span>tài khoản</span>
          </AppTitle>
          <p className="mt-2 text-caption text-slate-600 dark:text-slate-400">Tổng tài sản: <span className="font-extrabold text-primary dark:text-brand-400">{formatVND(totalBalance)}</span></p>
        </div>
        <div className="flex gap-2">
          {wallets.length >= 2 && (
            <AppButton unstyled onClick={() => setShowTransfer(true)} className="inline-flex h-8 items-center gap-2 rounded-md border border-primary bg-white px-3 text-mini font-bold text-primary shadow-sm transition hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800">
              <ArrowLeftRight className="size-3" /><span>Chuyển tiền</span>
            </AppButton>
          )}
          <AppButton unstyled id="add-wallet-btn" onClick={() => setShowModal(true)} className="inline-flex h-8 items-center gap-2 rounded-md bg-action px-3.5 text-mini font-bold text-white shadow-action-button transition hover:bg-action-hover">
            <Plus className="size-3" /><span>Thêm ví</span>
          </AppButton>
        </div>
      </div>

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
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet: any) => {
            const meta = getWalletMeta(wallet.type);
            const Icon = meta.icon;
            return (
              <div key={wallet.id} className="group relative flex min-h-wallet flex-col rounded-control border border-white/80 bg-white px-3 py-3 shadow-wallet transition hover:-translate-y-0.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900 sm:min-h-wallet">
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                    <Icon  className={"size-3.5 " + (meta.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-micro font-semibold uppercase leading-section tracking-wide text-slate-500 dark:text-slate-400">{meta.label}</p>
                    <p className="mt-0.5 truncate py-0.5 text-xs font-extrabold leading-hero text-slate-950 dark:text-slate-100">{wallet.name}</p>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-0.5 rounded-md bg-white/90 opacity-0 shadow-sm transition group-hover:opacity-100 focus-within:opacity-100 dark:bg-slate-900/90">
                    <AppButton unstyled
                      id={`edit-wallet-${wallet.id}`}
                      onClick={() => setEditWallet(wallet)}
                      aria-label={`Chỉnh sửa ví ${wallet.name}`}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                    >
                      <Pencil className="size-icon-tiny" />
                    </AppButton>
                    <AppButton unstyled
                      id={`delete-wallet-${wallet.id}`}
                      onClick={() => { if (confirm(`Xóa ví "${wallet.name}"?`)) { setDeletingId(wallet.id); deleteMutation.mutate(wallet.id); } }}
                      aria-label={`Xóa ví ${wallet.name}`}
                      className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    >
                      {deletingId === wallet.id && deleteMutation.isPending ? <Loader2  className="size-icon-tiny animate-spin" /> : <Trash2 className="size-icon-tiny" />}
                    </AppButton>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <p className={`text-lg font-extrabold leading-none ${Number(wallet.initialBalance) < 0 ? 'text-rose-500' : 'text-balance-positive'}`}>
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
