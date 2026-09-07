import { ContextBuilderService, FinancialContext } from '../../services/ai/context-builder.service';
import { AnalysisService } from '../../services/ai/analysis.service';
import { AdvisorService } from '../../services/ai/advisor.service';
import { LlmProvider } from '../../services/ai/llm.provider';

describe('AI list identities', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps IDs unique and stable when duplicate labels are reordered and amounts change', async () => {
    const context: FinancialContext = {
      month: 9, year: 2026,
      summary: { netWorth: 100, monthlyIncome: 100, monthlyExpense: 80, monthlySavings: 20, savingsRate: 20 },
      categoryExpenses: [], trend: [], wallets: [], recurringCount: 0,
      topExpenseCategory: null, previousMonthExpense: 80, expenseChangePercent: 0,
      budgets: ['budget-a', 'budget-b'].map((id) => ({ id, categoryName: 'Cùng tên', limit: 10, spent: 11, percentage: 110, status: 'EXCEEDED' })),
      savingGoals: ['goal-a', 'goal-b'].map((id) => ({ id, title: 'Cùng tên', progress: 10, status: 'ACTIVE', targetAmount: 100, currentAmount: 10 })),
    };
    jest.spyOn(ContextBuilderService.prototype, 'build').mockResolvedValue(context);
    jest.spyOn(LlmProvider.prototype, 'isAvailable').mockReturnValue(false);
    const analysis = new AnalysisService();
    const advisor = new AdvisorService();
    const beforeInsights = (await analysis.analyzeExpenses('user')).insights;
    const beforeRecommendations = (await advisor.getRecommendations('user')).recommendations;

    context.budgets.reverse();
    context.savingGoals.reverse();
    context.budgets[0].spent = 12;
    context.savingGoals[0].progress = 15;
    const afterInsights = (await analysis.analyzeExpenses('user')).insights;
    const afterRecommendations = (await advisor.getRecommendations('user')).recommendations;
    for (const [before, after] of [[beforeInsights, afterInsights], [beforeRecommendations, afterRecommendations]]) {
      const ids = before.map((item) => item.id);
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
      expect(after.map((item) => item.id).sort()).toEqual(ids.sort());
    }
  });
});
