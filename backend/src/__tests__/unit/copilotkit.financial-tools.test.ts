import { z } from 'zod';

jest.mock('@copilotkit/runtime/v2', () => ({
  defineTool: jest.fn().mockImplementation((options) => options),
}));

import { buildFinancialTools } from '../../copilotkit/financial-tools';

type ExecutableTool = {
  name: string;
  parameters: z.ZodTypeAny;
  execute?: (args: Record<string, unknown>) => Promise<any>;
};

const financialContext = {
  summary: {
    netWorth: 120_000_000,
    monthlyIncome: 30_000_000,
    monthlyExpense: 12_000_000,
    monthlySavings: 18_000_000,
    savingsRate: 60,
  },
  month: 5,
  year: 2026,
  categoryExpenses: [
    { id: 'cat-1', name: 'Nhà ở', amount: 6_000_000, color: '#111111' },
    { id: 'cat-2', name: 'Ăn uống', amount: 3_000_000, color: '#222222' },
    { id: 'cat-3', name: 'Đi lại', amount: 1_500_000, color: '#333333' },
  ],
  trend: [],
  budgets: [],
  savingGoals: [],
  wallets: [],
  recurringCount: 0,
  topExpenseCategory: { name: 'Nhà ở', amount: 6_000_000 },
  previousMonthExpense: 10_000_000,
  expenseChangePercent: 20,
};

const createDependencies = () => ({
  contextBuilder: {
    build: jest.fn().mockResolvedValue(financialContext),
  },
  budgetService: {
    getBudgets: jest.fn().mockResolvedValue([
      {
        amount: 5_000_000,
        spent: 5_200_000,
        percentage: 104,
        status: 'EXCEEDED',
        category: { name: 'Ăn uống' },
      },
    ]),
  },
  savingGoalService: {
    getGoals: jest.fn().mockResolvedValue([
      {
        title: 'Quỹ khẩn cấp',
        targetAmount: 60_000_000,
        currentAmount: 30_000_000,
        progress: 50,
        status: 'ACTIVE',
      },
    ]),
  },
  transactionService: {
    getMonthlyReport: jest.fn()
      .mockResolvedValueOnce({ summary: { totalExpense: 12_000_000 } })
      .mockResolvedValueOnce({ summary: { totalExpense: 10_000_000 } }),
  },
});

const getTool = (tools: ReturnType<typeof buildFinancialTools>, name: string): ExecutableTool => {
  const tool = (tools as ExecutableTool[]).find((candidate) => candidate.name === name);
  if (!tool?.execute) throw new Error(`Tool ${name} is not executable`);
  return tool;
};

describe('CopilotKit financial tools', () => {
  const logger = { info: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers exactly the five read-only MVP tools', () => {
    const tools = buildFinancialTools('owner-user', { logger }, createDependencies());

    expect(tools.map((tool) => tool.name)).toEqual([
      'getFinancialOverview',
      'getExpenseBreakdown',
      'getBudgetStatus',
      'getSavingGoals',
      'compareMonthlySpending',
    ]);
  });

  it('keeps userId in the server closure and rejects it as model input', async () => {
    const dependencies = createDependencies();
    const overview = getTool(
      buildFinancialTools('owner-user', { requestId: 'request-1', logger }, dependencies),
      'getFinancialOverview',
    );

    expect(overview.parameters.safeParse({ month: 5, year: 2026, userId: 'attacker-user' }).success)
      .toBe(false);

    const result = await overview.execute!({ month: 5, year: 2026, userId: 'attacker-user' });

    expect(dependencies.contextBuilder.build).toHaveBeenCalledWith('owner-user', 5, 2026);
    expect(result).toEqual(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        netWorth: 120_000_000,
        monthlySavings: 18_000_000,
        currency: 'VND',
      }),
    }));
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      requestId: 'request-1',
      toolName: 'getFinancialOverview',
      success: true,
    }));
  });

  it('rejects invalid month and year inputs before a tool can execute', () => {
    const overview = getTool(
      buildFinancialTools('owner-user', { logger }, createDependencies()),
      'getFinancialOverview',
    );

    expect(overview.parameters.safeParse({ month: 0, year: 2026 }).success).toBe(false);
    expect(overview.parameters.safeParse({ month: 13, year: 2026 }).success).toBe(false);
    expect(overview.parameters.safeParse({ month: 5, year: 1999 }).success).toBe(false);
    expect(overview.parameters.safeParse({ month: 5.5, year: 2026 }).success).toBe(false);
  });

  it('returns only a bounded aggregate expense breakdown', async () => {
    const tool = getTool(
      buildFinancialTools('owner-user', { logger }, createDependencies()),
      'getExpenseBreakdown',
    );

    const result = await tool.execute!({ month: 5, year: 2026, limit: 2 });

    expect(result.data.categories).toEqual([
      { name: 'Nhà ở', amount: 6_000_000, percentage: 50 },
      { name: 'Ăn uống', amount: 3_000_000, percentage: 25 },
    ]);
    expect(JSON.stringify(result)).not.toContain('cat-1');
    expect(JSON.stringify(result)).not.toContain('#111111');
  });

  it('normalizes exceeded budgets and returns saving goal progress', async () => {
    const dependencies = createDependencies();
    const tools = buildFinancialTools('owner-user', { logger }, dependencies);

    const budgetResult = await getTool(tools, 'getBudgetStatus').execute!({ month: 5, year: 2026 });
    const goalsResult = await getTool(tools, 'getSavingGoals').execute!({});

    expect(dependencies.budgetService.getBudgets).toHaveBeenCalledWith('owner-user', 5, 2026);
    expect(budgetResult.data.budgets[0]).toEqual(expect.objectContaining({
      categoryName: 'Ăn uống',
      percentage: 104,
      status: 'CRITICAL',
    }));
    expect(goalsResult.data.goals[0]).toEqual(expect.objectContaining({
      title: 'Quỹ khẩn cấp',
      progress: 50,
      status: 'ACTIVE',
    }));
  });

  it('compares January with December of the previous year by default', async () => {
    const dependencies = createDependencies();
    const tool = getTool(
      buildFinancialTools('owner-user', { logger }, dependencies),
      'compareMonthlySpending',
    );

    const result = await tool.execute!({ month: 1, year: 2026 });

    expect(dependencies.transactionService.getMonthlyReport).toHaveBeenNthCalledWith(1, 'owner-user', 1, 2026);
    expect(dependencies.transactionService.getMonthlyReport).toHaveBeenNthCalledWith(2, 'owner-user', 12, 2025);
    expect(result.data).toEqual(expect.objectContaining({
      differenceAmount: 2_000_000,
      absoluteDifferenceAmount: 2_000_000,
      changePercent: 20,
      direction: 'INCREASE',
    }));
  });

  it('maps timeouts to a safe error without logging financial data or exception details', async () => {
    const dependencies = createDependencies();
    dependencies.contextBuilder.build.mockImplementation(() => new Promise(() => undefined));
    const tool = getTool(
      buildFinancialTools('owner-user', { requestId: 'request-timeout', timeoutMs: 5, logger }, dependencies),
      'getFinancialOverview',
    );

    const result = await tool.execute!({ month: 5, year: 2026 });

    expect(result).toEqual({
      success: false,
      error: {
        code: 'TOOL_TIMEOUT',
        message: 'Financial data request timed out. Please try again.',
        retryable: true,
      },
    });
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({
      requestId: 'request-timeout',
      toolName: 'getFinancialOverview',
      success: false,
      errorCode: 'TOOL_TIMEOUT',
    }));
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('120000000');
  });
});
