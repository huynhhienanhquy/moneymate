import { useState } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import AppButton from '@/components/common/AppButton/AppButton';
import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppSelect from '@/components/common/AppSelect/AppSelect';
import AppTitle from '@/components/common/AppTitle/AppTitle';
import { formatVND } from '@/utils/formatCurrency';

type TransferModalProps = {
  wallets: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
};

const createEmptyTransfer = () => ({
  sourceWalletId: '',
  destinationWalletId: '',
  amount: '',
  note: '',
  transferDate: new Date().toISOString().slice(0, 10),
});

const TransferModal = ({ wallets, onClose, onSave, loading }: TransferModalProps) => {
  const [form, setForm] = useState(createEmptyTransfer);

  const handleSave = () => {
    if (!form.sourceWalletId || !form.destinationWalletId || !form.amount) return;
    onSave({ ...form, amount: parseFloat(form.amount), transferDate: new Date(form.transferDate) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="app-shell-card w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <AppTitle unstyled level={2} className="text-lg font-extrabold text-slate-950 dark:text-slate-100">Chuyển tiền giữa ví</AppTitle>
          <AppButton unstyled onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></AppButton>
        </div>
        <div className="space-y-4">
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Từ ví</AppLabel>
            <div className="relative">
              <AppSelect unstyled value={form.sourceWalletId} onChange={(e) => setForm(p => ({ ...p, sourceWalletId: e.target.value }))} className="app-select appearance-none pr-9">
                <option value="">-- Chọn ví nguồn --</option>
                {wallets.map((wallet: any) => <option key={wallet.id} value={wallet.id}>{wallet.name} ({formatVND(Number(wallet.initialBalance))})</option>)}
              </AppSelect>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Đến ví</AppLabel>
            <div className="relative">
              <AppSelect unstyled value={form.destinationWalletId} onChange={(e) => setForm(p => ({ ...p, destinationWalletId: e.target.value }))} className="app-select appearance-none pr-9">
                <option value="">-- Chọn ví đích --</option>
                {wallets.filter((wallet: any) => wallet.id !== form.sourceWalletId).map((wallet: any) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
              </AppSelect>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số tiền</AppLabel>
            <AppInput unstyled type="number" min="0" step="1000" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} className="app-input" />
          </div>
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngày chuyển</AppLabel>
            <AppInput unstyled type="date" value={form.transferDate} onChange={(e) => setForm(p => ({ ...p, transferDate: e.target.value }))} className="app-input" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <AppButton unstyled onClick={onClose} className="app-secondary-button flex-1">Hủy</AppButton>
          <AppButton unstyled onClick={handleSave} disabled={loading || !form.sourceWalletId || !form.destinationWalletId || !form.amount} className="app-primary-button flex-1">
            {loading && <Loader2 size={16} className="animate-spin" />} Chuyển tiền
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
