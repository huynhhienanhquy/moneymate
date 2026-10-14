import type { ComponentType } from 'react';
import { render } from './render';

const wallet = { id: 'wallet-1', name: 'Ví chính', type: 'CASH', currency: 'VND', initialBalance: 5_000_000 };
const category = { id: 'category-1', name: 'Ăn uống', type: 'EXPENSE', color: '#ef4444', icon: 'utensils', isSystem: false };
const incomeCategory = { id: 'category-2', name: 'Lương', type: 'INCOME', color: '#10b981', icon: 'banknote', isSystem: true };
const transaction = { id: 'tx-1', walletId: wallet.id, categoryId: category.id, amount: 120_000, type: 'EXPENSE', note: 'Ăn trưa', transactionDate: '2026-08-20', wallet, category };
const transferTransaction = { ...transaction, id: 'tx-transfer', type: 'TRANSFER', note: 'Chuyển tiền' };

const queryFixtures: Record<string, unknown> = {
  'admin-users': [{ id: 'user-1', fullName: 'Money Mate', email: 'user@moneymate.vn', role: 'USER', isActive: true, createdAt: '2025-01-01', _count: { transactions: 2, wallets: 1 } }],
  wallets: [wallet, { ...wallet, id: 'wallet-2', name: 'Ngân hàng', type: 'BANK' }],
  categories: [category, incomeCategory],
  transactions: { transactions: [transaction, { ...transaction, id: 'tx-2', type: 'INCOME', category: incomeCategory }, transferTransaction], pagination: { total: 20 } },
  budgets: [{ id: 'budget-1', categoryId: category.id, category, amount: 2_000_000, spent: 1_000_000, percentage: 50, month: 8, year: 2026 }],
  recurring: [{ id: 'recurring-1', walletId: wallet.id, categoryId: category.id, wallet, category, amount: 100_000, type: 'EXPENSE', note: 'Internet', frequency: 'MONTHLY', startDate: '2026-01-01', nextRunDate: '2026-09-01', isActive: true }],
  'saving-goals': [{ id: 'goal-1', title: 'Du lịch', name: 'Du lịch', targetAmount: 10_000_000, currentAmount: 2_000_000, targetDate: '2026-12-31', deadline: '2026-12-31', color: '#2a95ff' }],
  dashboard: { totalBalance: 5_000_000, netWorth: 5_000_000, monthlyIncome: 10_000_000, monthlyExpense: 4_000_000, monthlySavings: 6_000_000, savingsRate: 60, categoryExpenses: [{ id: category.id, categoryId: category.id, categoryName: category.name, name: category.name, value: 1_000_000, amount: 1_000_000, color: category.color }], recentTransactions: [transaction] },
  'monthly-report': { summary: { totalIncome: 5_000_000, totalExpense: 4_000_000, netSavings: 1_000_000 }, categoryExpenses: [{ id: category.id, categoryId: category.id, categoryName: category.name, name: category.name, amount: 1_000_000, value: 1_000_000 }] },
  'yearly-report': { walletBalanceTotal: 5_000_000, totalIncome: 120_000_000, totalExpense: 48_000_000, netSavings: 72_000_000, monthlyData: [{ month: 1, income: 10_000_000, expense: 4_000_000, savings: 6_000_000 }] },
  'monthly-trend': [{ month: 7, year: 2026, income: 10_000_000, expense: 4_000_000 }],
  'monthly-balance-v7': { accountCreatedAt: '2025-01-01', monthlyData: [
    { month: 1, income: 999_999, walletBalance: 5_000_000, expense: 4_000_000, savings: 999_999 },
    { month: 2, income: 999_999, walletBalance: 3_000_000, expense: 4_000_000, savings: 999_999 },
    { month: 3, income: 999_999, walletBalance: 7_000_000, expense: 2_000_000, savings: 999_999 },
  ] },
  profile: { id: 'user-1', fullName: 'Money Mate', email: 'user@moneymate.vn', avatarUrl: null, role: 'USER', createdAt: '2025-01-01' },
  'ai-advisor': { recommendations: [{ id: 'recommendation-1', title: 'Tiết kiệm', description: 'Giảm chi tiêu', priority: 'HIGH' }] },
  'ai-analysis': { summary: 'Ổn định', insights: [{ id: 'insight-1', title: 'Ăn uống', description: 'Chi tiêu tăng', severity: 'WARNING' }] },
  'ai-analysis-dash': { summary: 'Ổn định', insights: [{ id: 'insight-1', title: 'Ăn uống', description: 'Chi tiêu tăng', severity: 'WARNING' }] },
  'ai-forecast': { forecasts: [{ categoryId: category.id, categoryName: category.name, predictedAmount: 2_500_000, severity: 'WARNING', message: 'Có thể vượt ngân sách' }] },
  'ai-status': { configured: true, provider: 'AI' },
};
export type PageQueryMode = 'populated' | 'loading' | 'empty' | 'error';

let queryMode: PageQueryMode = 'populated';
const { navigateMock, authLogoutMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  authLogoutMock: vi.fn(),
}));

/**
 * Set page query mode used by the page test workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param mode - The mode value required by the operation.
 * @returns Nothing; the operation is complete when the function returns.
 */
export const setPageQueryMode = (mode: PageQueryMode) => {
  queryMode = mode;
};

/**
 * Render page for page test.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param Page - The page value required by the operation.
 * @param mode - The mode value required by the operation.
 * @returns The resulting page test value for the caller.
 */
export const renderPage = (Page: ComponentType, mode: PageQueryMode = 'populated') => {
  setPageQueryMode(mode);
  return render(<Page />);
};

vi.mock('react-router-dom', () => ({
  /**
   * Render the link interface.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @param props - The properties that configure this React component.
   * @returns The rendered link interface.
   */
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  /**
   * Provide navigate state and actions to React consumers.
   *
   * Use it in React components that need this shared behavior.
   * @returns The current navigate state and the actions that operate on it.
   */
  useNavigate: () => navigateMock,
}));
vi.mock('@/stores/auth.store', () => ({
  /**
   * Provide auth store state and actions to React consumers.
   *
   * Use it in React components that need this shared behavior.
   * @param selector - The selector value required by the operation.
   * @returns The current auth store state and the actions that operate on it.
   */
  useAuthStore: (selector?: (state: unknown) => unknown) => {
    const state = { user: { id: 'user-1', fullName: 'Money Mate', email: 'user@moneymate.vn', role: 'USER' }, login: vi.fn(), logout: authLogoutMock, setUser: vi.fn() };
    return selector ? selector(state) : state;
  },
}));
vi.mock('@/services/api/client', () => ({
  /**
   * Run auth session transition for page test.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @param operation - The operation value required by the operation.
   * @returns The resulting page test value for the caller.
   */
  runAuthSessionTransition: (operation: () => Promise<unknown>) => operation(),
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: {} } }),
    post: vi.fn().mockResolvedValue({ data: { data: { id: 'created-1' } } }),
    put: vi.fn().mockResolvedValue({ data: { data: {} } }),
    delete: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    /**
     * Provide query state and actions to React consumers.
     *
     * Use it in React components that need this shared behavior.
     * @param props - The properties that configure this React component.
     * @returns The current query state and the actions that operate on it.
     */
    useQuery: ({ queryKey, queryFn }: { queryKey: unknown[]; queryFn?: () => Promise<unknown> }) => {
      void queryFn?.();
      const fixture = queryFixtures[String(queryKey[0])];
      const emptyData = Array.isArray(fixture) ? [] : undefined;
      return {
        data: queryMode === 'populated' ? fixture : emptyData,
        isLoading: queryMode === 'loading',
        isError: queryMode === 'error',
        refetch: vi.fn(),
      };
    },
    /**
     * Provide mutation state and actions to React consumers.
     *
     * Use it in React components that need this shared behavior.
     * @param options - Settings that customize how the operation runs.
     * @returns The current mutation state and the actions that operate on it.
     */
    useMutation: (options: { mutationFn?: (variables: unknown) => unknown; onSuccess?: (data?: unknown) => void; onError?: () => void }) => ({
      mutate: vi.fn((variables: unknown) => {
        try {
          void options.mutationFn?.(variables);
          options.onSuccess?.({});
        } catch {
          options.onError?.();
        }
      }),
      mutateAsync: vi.fn(async (variables: unknown) => options.mutationFn?.(variables)),
      isPending: false,
    }),
    /**
     * Provide query client state and actions to React consumers.
     *
     * Use it in React components that need this shared behavior.
     * @returns The current query client state and the actions that operate on it.
     */
    useQueryClient: () => ({ invalidateQueries: vi.fn(), clear: vi.fn() }),
  };
});
vi.mock('recharts', () => {
  /**
   * Render the chart interface.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @param props - The properties that configure this React component.
   * @returns The rendered chart interface.
   */
  const Chart = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { BarChart: Chart, Bar: Chart, XAxis: Chart, YAxis: Chart, CartesianGrid: Chart, Tooltip: Chart, ResponsiveContainer: Chart, LineChart: Chart, Line: Chart, LabelList: Chart, PieChart: Chart, Pie: Chart, Cell: Chart, Legend: Chart };
});
