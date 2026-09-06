import { BudgetService } from '../../services/budget.service';
import { ContextBuilderService } from '../../services/ai/context-builder.service';
import { RecurringRepository } from '../../repositories/recurring.repository';
import { SavingGoalService } from '../../services/saving-goal.service';
import { TransactionService } from '../../services/transaction.service';
import { WalletRepository } from '../../repositories/wallet.repository';

describe('ContextBuilderService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the requested month report instead of current dashboard totals', async () => {
    jest.spyOn(TransactionService.prototype, 'getDashboardSummary').mockResolvedValue({
      netWorth: 100_000_000,
      monthlyIncome: 99,
      monthlyExpense: 88,
      monthlySavings: 11,
    } as any);
    jest.spyOn(TransactionService.prototype, 'getMonthlyReport')
      .mockResolvedValueOnce({
        month: 5,
        year: 2025,
        summary: {
          totalIncome: 20_000_000,
          totalExpense: 12_000_000,
          netSavings: 8_000_000,
        },
        categoryExpenses: [],
      } as any)
      .mockResolvedValueOnce({
        month: 4,
        year: 2025,
        summary: { totalExpense: 10_000_000 },
        categoryExpenses: [],
      } as any);
    jest.spyOn(TransactionService.prototype, 'getMonthlyTrend').mockResolvedValue([]);
    jest.spyOn(BudgetService.prototype, 'getBudgets').mockResolvedValue([]);
    jest.spyOn(SavingGoalService.prototype, 'getGoals').mockResolvedValue([]);
    jest.spyOn(WalletRepository.prototype, 'findAllByUserId').mockResolvedValue([]);
    jest.spyOn(RecurringRepository.prototype, 'findAllByUserId').mockResolvedValue([]);

    const result = await new ContextBuilderService().build('owner-user', 5, 2025);

    expect(result.summary).toEqual({
      netWorth: 100_000_000,
      monthlyIncome: 20_000_000,
      monthlyExpense: 12_000_000,
      monthlySavings: 8_000_000,
      savingsRate: 40,
    });
    expect(result.previousMonthExpense).toBe(10_000_000);
    expect(result.expenseChangePercent).toBe(20);
  });
});
