import { useFrontendTool } from '@copilotkit/react-core/v2';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES } from '@/constants/routes';
import { useThemeStore } from '@/stores/theme.store';

const PAGE_DESTINATIONS = {
  dashboard: { name: 'Tổng quan', path: APP_ROUTES.dashboard },
  wallets: { name: 'Ví tài khoản', path: APP_ROUTES.wallets },
  transactions: { name: 'Giao dịch', path: APP_ROUTES.transactions },
  categories: { name: 'Danh mục', path: APP_ROUTES.categories },
  budgets: { name: 'Ngân sách', path: APP_ROUTES.budgets },
  savingGoals: { name: 'Mục tiêu tiết kiệm', path: APP_ROUTES.savingGoals },
  recurring: { name: 'Giao dịch định kỳ', path: APP_ROUTES.recurring },
  reports: { name: 'Báo cáo', path: APP_ROUTES.reports },
  monthlyBalance: { name: 'Tiết kiệm tháng', path: APP_ROUTES.monthlyBalance },
  aiAdvisor: { name: 'AI Tài chính', path: APP_ROUTES.aiAdvisor },
  profile: { name: 'Hồ sơ', path: APP_ROUTES.profile },
} as const;

const pageSchema = z.enum([
  'dashboard',
  'wallets',
  'transactions',
  'categories',
  'budgets',
  'savingGoals',
  'recurring',
  'reports',
  'monthlyBalance',
  'aiAdvisor',
  'profile',
]);

export function AppControlTools() {
  const navigate = useNavigate();
  const setTheme = useThemeStore((state) => state.setTheme);

  useFrontendTool(
    {
      name: 'setAppTheme',
      description:
        'Đổi giao diện MoneyMate sang chế độ sáng hoặc tối. Dùng ngay khi người dùng yêu cầu bật dark mode, light mode, chế độ tối hoặc chế độ sáng.',
      parameters: z.object({
        theme: z.enum(['dark', 'light']).describe('Chế độ giao diện cần áp dụng.'),
      }),
      handler: async ({ theme }) => {
        setTheme(theme);
        return `Đã chuyển MoneyMate sang chế độ ${theme === 'dark' ? 'tối' : 'sáng'}.`;
      },
      followUp: false,
      agentId: 'default',
    },
    [setTheme],
  );

  useFrontendTool(
    {
      name: 'navigateToPage',
      description:
        'Mở một trang trong ứng dụng MoneyMate. Các trang hỗ trợ: Tổng quan, Ví tài khoản, Giao dịch, Danh mục, Ngân sách, Mục tiêu tiết kiệm, Giao dịch định kỳ, Báo cáo, Tiết kiệm tháng, AI Tài chính và Hồ sơ.',
      parameters: z.object({
        page: pageSchema.describe(
          'Mã trang: dashboard=Tổng quan, wallets=Ví tài khoản, transactions=Giao dịch, categories=Danh mục, budgets=Ngân sách, savingGoals=Mục tiêu tiết kiệm, recurring=Giao dịch định kỳ, reports=Báo cáo, monthlyBalance=Tiết kiệm tháng, aiAdvisor=AI Tài chính, profile=Hồ sơ.',
        ),
      }),
      handler: async ({ page }) => {
        const destination = PAGE_DESTINATIONS[page];
        navigate(destination.path);
        return `Đã mở trang ${destination.name}.`;
      },
      followUp: false,
      agentId: 'default',
    },
    [navigate],
  );

  return null;
}

export default AppControlTools;
