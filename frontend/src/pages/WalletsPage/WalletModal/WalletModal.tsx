import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import AppButton from '@/components/common/AppButton/AppButton';
import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppTitle from '@/components/common/AppTitle/AppTitle';
import { WALLET_TYPES } from '../wallets.data';

type WalletModalProps = {
  wallet?: any;
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
};

const EMPTY_FORM = { name: '', type: 'CASH', currency: 'VND', initialBalance: 0 };

const WalletModal = ({ wallet, onClose, onSave, loading }: WalletModalProps) => {
  const [form, setForm] = useState(wallet ? { name: wallet.name, type: wallet.type, currency: wallet.currency, initialBalance: Number(wallet.initialBalance) } : EMPTY_FORM);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="app-shell-card w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <AppTitle unstyled level={2} className="text-lg font-extrabold text-slate-950 dark:text-slate-100">{wallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}</AppTitle>
          <AppButton unstyled onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></AppButton>
        </div>
        <div className="space-y-4">
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên ví</AppLabel>
            <AppInput unstyled id="wallet-name" type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Tiền mặt, Techcombank..." className="app-input" />
          </div>
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại ví</AppLabel>
            <div className="grid grid-cols-3 gap-2">
              {WALLET_TYPES.map((walletType) => {
                const Icon = walletType.icon;
                const selected = form.type === walletType.value;
                return (
                  <AppButton unstyled key={walletType.value} type="button" id={`wallet-type-${walletType.value.toLowerCase()}`} onClick={() => setForm(p => ({ ...p, type: walletType.value }))} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${selected ? `${walletType.bg} ${walletType.color} border-current` : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}>
                    <Icon size={18} />
                    {walletType.label}
                  </AppButton>
                );
              })}
            </div>
          </div>
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số dư ban đầu</AppLabel>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">₫</span>
              <AppInput unstyled id="wallet-balance" type="number" min="0" value={form.initialBalance} onChange={(e) => setForm(p => ({ ...p, initialBalance: parseFloat(e.target.value) || 0 }))} className="app-input pl-8" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <AppButton unstyled onClick={onClose} className="app-secondary-button flex-1">Hủy</AppButton>
          <AppButton unstyled id="wallet-save" onClick={() => onSave(form)} disabled={loading || !form.name} className="app-primary-button flex-1">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {wallet ? 'Lưu thay đổi' : 'Tạo ví'}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
