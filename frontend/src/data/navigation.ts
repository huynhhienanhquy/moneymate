import {
  BarChart3,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Shield,
  Sparkles,
  Tags,
  Target,
  User,
  Wallet,
  WalletCards,
} from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import type { NavigationItem } from '@/types/navigation';

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { name: 'Tổng quan', path: APP_ROUTES.dashboard, icon: LayoutDashboard },
  { name: 'Ví tài khoản', path: APP_ROUTES.wallets, icon: Wallet },
  { name: 'Giao dịch', path: APP_ROUTES.transactions, icon: ReceiptText },
  { name: 'Danh mục', path: APP_ROUTES.categories, icon: Tags },
  { name: 'Ngân sách', path: APP_ROUTES.budgets, icon: PiggyBank },
  { name: 'Mục tiêu', path: APP_ROUTES.savingGoals, icon: Target },
  { name: 'Định kỳ', path: APP_ROUTES.recurring, icon: RefreshCw },
  { name: 'Báo cáo', path: APP_ROUTES.reports, icon: BarChart3 },
  { name: 'Tiết kiệm tháng', path: APP_ROUTES.monthlyBalance, icon: WalletCards },
  { name: 'AI Tài chính', path: APP_ROUTES.aiAdvisor, icon: Sparkles },
  { name: 'Hồ sơ', path: APP_ROUTES.profile, icon: User },
  { name: 'Quản trị', path: APP_ROUTES.admin, icon: Shield, adminOnly: true },
];
