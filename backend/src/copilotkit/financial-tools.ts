import { defineTool } from '@copilotkit/runtime/v2';
import { z } from 'zod';
import { ContextBuilderService } from '../services/ai/context-builder.service';
import { BudgetService } from '../services/budget.service';
import { SavingGoalService } from '../services/saving-goal.service';
import { TransactionService } from '../services/transaction.service';

const DEFAULT_CATEGORY_LIMIT = 5;
const MAX_CATEGORY_LIMIT = 8;
const MAX_BUDGETS = 20;
const MAX_SAVING_GOALS = 20;
const DEFAULT_TOOL_TIMEOUT_MS = 5_000;
const MIN_YEAR = 2000;
const MAX_YEAR = new Date().getFullYear() + 1;

const monthParameter = z.number().int().min(1).max(12).optional();
const yearParameter = z.number().int().min(MIN_YEAR).max(MAX_YEAR).optional();

interface FinancialToolDependencies {
  contextBuilder: Pick<ContextBuilderService, 'build'>;
  budgetService: Pick<BudgetService, 'getBudgets'>;
  savingGoalService: Pick<SavingGoalService, 'getGoals'>;
  transactionService: Pick<TransactionService, 'getMonthlyReport'>;
}

interface FinancialToolLogEvent {
  operation: 'copilotkit-financial-tool';
  requestId?: string;
  toolName: string;
  latencyMs: number;
  success: boolean;
  errorCode?: 'TOOL_TIMEOUT' | 'FINANCIAL_DATA_UNAVAILABLE';
}

export interface FinancialToolLogger {
  info(event: FinancialToolLogEvent): void;
  error(event: FinancialToolLogEvent): void;
}

export interface FinancialToolContext {
  requestId?: string;
  timeoutMs?: number;
  logger?: FinancialToolLogger;
}

class FinancialToolTimeoutError extends Error {
  constructor() {
    super('Financial tool timed out');
    this.name = 'FinancialToolTimeoutError';
  }
}

const defaultDependencies = (): FinancialToolDependencies => ({
  contextBuilder: new ContextBuilderService(),
  budgetService: new BudgetService(),
  savingGoalService: new SavingGoalService(),
  transactionService: new TransactionService(),
});

const defaultLogger: FinancialToolLogger = {
  info: (event) => console.info(event),
  error: (event) => console.error(event),
};

const resolvePeriod = (month?: number, year?: number) => {
  const now = new Date();
  return {
    month: month ?? now.getMonth() + 1,
    year: year ?? now.getFullYear(),
  };
};

const previousPeriod = ({ month, year }: { month: number; year: number }) => ({
  month: month === 1 ? 12 : month - 1,
  year: month === 1 ? year - 1 : year,
});

const withTimeout = <T>(operation: Promise<T>, timeoutMs: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new FinancialToolTimeoutError()), timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });

export const buildFinancialTools = (
  userId: string,
  context: FinancialToolContext = {},
  dependencies: FinancialToolDependencies = defaultDependencies(),
) => {
  const timeoutMs = context.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS;
  const logger = context.logger ?? defaultLogger;

  const executeSafely = async <T>(toolName: string, operation: () => Promise<T>) => {
    const startedAt = Date.now();
    try {
      const data = await withTimeout(operation(), timeoutMs);
      logger.info({
        operation: 'copilotkit-financial-tool',
        requestId: context.requestId,
        toolName,
        latencyMs: Date.now() - startedAt,
        success: true,
      });
      return { success: true as const, data };
    } catch (error) {
      const timedOut = error instanceof FinancialToolTimeoutError;
      const errorCode = timedOut ? 'TOOL_TIMEOUT' : 'FINANCIAL_DATA_UNAVAILABLE';
      logger.error({
        operation: 'copilotkit-financial-tool',
        requestId: context.requestId,
        toolName,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorCode,
      });
      return {
        success: false as const,
        error: {
          code: errorCode,
          message: timedOut
            ? 'Financial data request timed out. Please try again.'
            : 'Financial data is temporarily unavailable. Please try again.',
          retryable: true,
        },
      };
    }
  };

  const getFinancialOverview = defineTool({
    name: 'getFinancialOverview',
    description: 'Get the authenticated user financial overview for one month, including net worth, income, expenses, savings, and savings rate. Read-only.',
    parameters: z.object({
      month: monthParameter.describe('Month from 1 to 12. Defaults to the current month.'),
      year: yearParameter.describe(`Year from ${MIN_YEAR} to ${MAX_YEAR}. Defaults to the current year.`),
    }).strict(),
    execute: async ({ month, year }) => executeSafely('getFinancialOverview', async () => {
      const period = resolvePeriod(month, year);
      const financialContext = await dependencies.contextBuilder.build(userId, period.month, period.year);
      return {
        ...period,
        netWorth: financialContext.summary.netWorth,
        netWorthAsOf: new Date().toISOString().slice(0, 10),
        monthlyIncome: financialContext.summary.monthlyIncome,
        monthlyExpense: financialContext.summary.monthlyExpense,
        monthlySavings: financialContext.summary.monthlySavings,
        savingsRate: financialContext.summary.savingsRate,
        currency: 'VND',
      };
    }),
  });

  const getExpenseBreakdown = defineTool({
    name: 'getExpenseBreakdown',
    description: 'Get the authenticated user largest expense categories for one month and compare total spending with the previous month. Returns only aggregate data, never transaction history. Read-only.',
    parameters: z.object({
      month: monthParameter.describe('Month from 1 to 12. Defaults to the current month.'),
      year: yearParameter.describe(`Year from ${MIN_YEAR} to ${MAX_YEAR}. Defaults to the current year.`),
      limit: z.number().int().min(1).max(MAX_CATEGORY_LIMIT).optional()
        .describe(`Maximum number of categories. Defaults to ${DEFAULT_CATEGORY_LIMIT}, maximum ${MAX_CATEGORY_LIMIT}.`),
    }).strict(),
    execute: async ({ month, year, limit }) => executeSafely('getExpenseBreakdown', async () => {
      const period = resolvePeriod(month, year);
      const financialContext = await dependencies.contextBuilder.build(userId, period.month, period.year);
      const totalExpense = financialContext.summary.monthlyExpense;
      const categories = financialContext.categoryExpenses
        .slice(0, limit ?? DEFAULT_CATEGORY_LIMIT)
        .map((category) => ({
          name: category.name,
          amount: category.amount,
          percentage: totalExpense > 0
            ? Math.round((category.amount / totalExpense) * 10_000) / 100
            : 0,
        }));

      return {
        ...period,
        totalExpense,
        previousMonthExpense: financialContext.previousMonthExpense,
        changePercent: financialContext.expenseChangePercent,
        categories,
        currency: 'VND',
      };
    }),
  });

  const getBudgetStatus = defineTool({
    name: 'getBudgetStatus',
    description: 'Get budget limits, spending, utilization percentage, and status for the authenticated user in one month. Read-only.',
    parameters: z.object({
      month: monthParameter.describe('Month from 1 to 12. Defaults to the current month.'),
      year: yearParameter.describe(`Year from ${MIN_YEAR} to ${MAX_YEAR}. Defaults to the current year.`),
    }).strict(),
    execute: async ({ month, year }) => executeSafely('getBudgetStatus', async () => {
      const period = resolvePeriod(month, year);
      const budgets = await dependencies.budgetService.getBudgets(userId, period.month, period.year);
      const limitedBudgets = budgets.slice(0, MAX_BUDGETS);
      return {
        ...period,
        budgets: limitedBudgets.map((budget) => ({
          categoryName: budget.category?.name || 'Tổng chi tiêu',
          limit: Number(budget.amount),
          spent: budget.spent,
          percentage: budget.percentage,
          status: budget.status === 'EXCEEDED' ? 'CRITICAL' : budget.status,
        })),
        totalBudgets: budgets.length,
        truncated: budgets.length > limitedBudgets.length,
        currency: 'VND',
      };
    }),
  });

  const getSavingGoals = defineTool({
    name: 'getSavingGoals',
    description: 'Get a bounded list of saving goals belonging to the authenticated user, including amounts, progress, and status. Read-only.',
    parameters: z.object({}).strict(),
    execute: async () => executeSafely('getSavingGoals', async () => {
      const goals = await dependencies.savingGoalService.getGoals(userId);
      const limitedGoals = goals.slice(0, MAX_SAVING_GOALS);
      return {
        goals: limitedGoals.map((goal) => ({
          title: goal.title,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          progress: goal.progress,
          status: goal.status,
        })),
        totalGoals: goals.length,
        truncated: goals.length > limitedGoals.length,
        currency: 'VND',
      };
    }),
  });

  const compareMonthlySpending = defineTool({
    name: 'compareMonthlySpending',
    description: 'Compare aggregate spending for two months belonging to the authenticated user. The comparison period defaults to the month before the primary period. Read-only.',
    parameters: z.object({
      month: monthParameter.describe('Primary month from 1 to 12. Defaults to the current month.'),
      year: yearParameter.describe(`Primary year from ${MIN_YEAR} to ${MAX_YEAR}. Defaults to the current year.`),
      compareMonth: monthParameter.describe('Comparison month. Defaults to the month before the primary period.'),
      compareYear: yearParameter.describe('Comparison year. Defaults consistently with compareMonth.'),
    }).strict(),
    execute: async ({ month, year, compareMonth, compareYear }) => executeSafely('compareMonthlySpending', async () => {
      const primaryPeriod = resolvePeriod(month, year);
      const defaultComparison = previousPeriod(primaryPeriod);
      const comparisonPeriod = {
        month: compareMonth ?? defaultComparison.month,
        year: compareYear ?? (compareMonth === undefined ? defaultComparison.year : primaryPeriod.year),
      };
      const [primaryReport, comparisonReport] = await Promise.all([
        dependencies.transactionService.getMonthlyReport(userId, primaryPeriod.month, primaryPeriod.year),
        dependencies.transactionService.getMonthlyReport(userId, comparisonPeriod.month, comparisonPeriod.year),
      ]);
      const primaryExpense = primaryReport.summary.totalExpense;
      const comparisonExpense = comparisonReport.summary.totalExpense;
      const differenceAmount = primaryExpense - comparisonExpense;
      const changePercent = comparisonExpense > 0
        ? Math.round((differenceAmount / comparisonExpense) * 10_000) / 100
        : null;

      return {
        primary: { ...primaryPeriod, totalExpense: primaryExpense },
        comparison: { ...comparisonPeriod, totalExpense: comparisonExpense },
        differenceAmount,
        absoluteDifferenceAmount: Math.abs(differenceAmount),
        changePercent,
        direction: differenceAmount > 0 ? 'INCREASE' : differenceAmount < 0 ? 'DECREASE' : 'NO_CHANGE',
        currency: 'VND',
      };
    }),
  });

  return [
    getFinancialOverview,
    getExpenseBreakdown,
    getBudgetStatus,
    getSavingGoals,
    compareMonthlySpending,
  ];
};
