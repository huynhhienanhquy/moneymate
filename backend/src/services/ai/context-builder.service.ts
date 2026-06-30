import { TransactionService } from '../transaction.service';
import { BudgetService } from '../budget.service';
import { SavingGoalService } from '../saving-goal.service';
import { WalletRepository } from '../../repositories/wallet.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { RecurringRepository } from '../../repositories/recurring.repository';
import { formatVND } from '../../config/ai';

export interface FinancialContext {
  summary: {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    savingsRate: number;
  };
  month: number;
  year: number;
  categoryExpenses: Array<{ id: string; name: string; amount: number; color: string }>;
  trend: Array<{ month: number; year: number; income: number; expense: number }>;
  budgets: Array<{ categoryName: string; limit: number; spent: number; percentage: number; status: string }>;
  savingGoals: Array<{ title: string; progress: number; status: string; targetAmount: number; currentAmount: number }>;
  wallets: Array<{ name: string; balance: number; type: string }>;
  recurringCount: number;
  topExpenseCategory: { name: string; amount: number } | null;
  previousMonthExpense: number;
  expenseChangePercent: number;
}

export class ContextBuilderService {
  private transactionService = new TransactionService();
  private budgetService = new BudgetService();
  private savingGoalService = new SavingGoalService();
  private walletRepository = new WalletRepository();
  private categoryRepository = new CategoryRepository();
  private recurringRepository = new RecurringRepository();

  async build(userId: string, month?: number, year?: number): Promise<FinancialContext> {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const [dashboard, report, trend, budgets, goals, wallets, recurring] = await Promise.all([
      this.transactionService.getDashboardSummary(userId),
      this.transactionService.getMonthlyReport(userId, m, y),
      this.transactionService.getMonthlyTrend(userId, 6),
      this.budgetService.getBudgets(userId, m, y),
      this.savingGoalService.getGoals(userId),
      this.walletRepository.findAllByUserId(userId),
      this.recurringRepository.findAllByUserId(userId),
    ]);

    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    const prevReport = await this.transactionService.getMonthlyReport(userId, prevMonth, prevYear);

    const monthlyExpense = report.summary.totalExpense;
    const previousMonthExpense = prevReport.summary.totalExpense;
    const expenseChangePercent = previousMonthExpense > 0
      ? Math.round(((monthlyExpense - previousMonthExpense) / previousMonthExpense) * 100)
      : 0;

    const categoryExpenses = report.categoryExpenses.sort((a: any, b: any) => b.amount - a.amount);
    const topExpenseCategory = categoryExpenses[0]
      ? { name: categoryExpenses[0].name, amount: categoryExpenses[0].amount }
      : null;

    const savingsRate = dashboard.monthlyIncome > 0
      ? Math.round((dashboard.monthlySavings / dashboard.monthlyIncome) * 100)
      : 0;

    return {
      summary: {
        netWorth: dashboard.netWorth,
        monthlyIncome: dashboard.monthlyIncome,
        monthlyExpense: dashboard.monthlyExpense,
        monthlySavings: dashboard.monthlySavings,
        savingsRate,
      },
      month: m,
      year: y,
      categoryExpenses,
      trend,
      budgets: budgets.map((b: any) => ({
        categoryName: b.category?.name || 'Tổng chi tiêu',
        limit: b.amount,
        spent: b.spent,
        percentage: b.percentage,
        status: b.status,
      })),
      savingGoals: goals.map((g: any) => ({
        title: g.title,
        progress: g.progress,
        status: g.status,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
      })),
      wallets: wallets.map((w: any) => ({
        name: w.name,
        balance: Number(w.initialBalance),
        type: w.type,
      })),
      recurringCount: recurring.filter((r: any) => r.isActive).length,
      topExpenseCategory,
      previousMonthExpense,
      expenseChangePercent,
    };
  }

  toPromptText(ctx: FinancialContext): string {
    const lines = [
      `Tháng ${ctx.month}/${ctx.year}:`,
      `- Thu nhập: ${formatVND(ctx.summary.monthlyIncome)}`,
      `- Chi tiêu: ${formatVND(ctx.summary.monthlyExpense)} (${ctx.expenseChangePercent >= 0 ? '+' : ''}${ctx.expenseChangePercent}% so với tháng trước)`,
      `- Tiết kiệm: ${formatVND(ctx.summary.monthlySavings)} (${ctx.summary.savingsRate}%)`,
      `- Tổng tài sản: ${formatVND(ctx.summary.netWorth)}`,
      `Top chi tiêu: ${ctx.topExpenseCategory ? `${ctx.topExpenseCategory.name} (${formatVND(ctx.topExpenseCategory.amount)})` : 'N/A'}`,
      `Danh mục chi tiêu: ${ctx.categoryExpenses.slice(0, 8).map(c => `${c.name}: ${formatVND(c.amount)}`).join(', ')}`,
      `Ngân sách: ${ctx.budgets.map(b => `${b.categoryName} ${b.percentage}%`).join(', ') || 'Chưa đặt'}`,
      `Mục tiêu tiết kiệm: ${ctx.savingGoals.map(g => `${g.title} ${g.progress}%`).join(', ') || 'Chưa có'}`,
    ];
    return lines.join('\n');
  }
}
