import { Banknote, CreditCard, PiggyBank, Smartphone, Wallet } from 'lucide-react';

export const WALLET_TYPES = [
  { value: 'CASH', label: 'Tiền mặt', icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { value: 'BANK', label: 'Ngân hàng', icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng', icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { value: 'E_WALLET', label: 'Ví điện tử', icon: Smartphone, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { value: 'SAVING', label: 'Tiết kiệm', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
] as const;
