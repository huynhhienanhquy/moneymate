import { defineTool } from '@copilotkit/runtime/v2';
import { z } from 'zod';
import { ContextBuilderService } from '../services/ai/context-builder.service';
import { BudgetService } from '../services/budget.service';
import { SavingGoalService } from '../services/saving-goal.service';
import { TransactionService } from '../services/transaction.service';
import { AppError } from '../common/app-error';

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
  transactionService: Pick<TransactionService, 'getMonthlyReport' | 'getTransactions' | 'getTransaction'>;
}

interface FinancialToolLogEvent {
  operation: 'copilotkit-financial-tool';
  requestId?: string;
  toolName: string;
  latencyMs: number;
  success: boolean;
  errorCode?: 'TOOL_TIMEOUT' | 'FINANCIAL_DATA_UNAVAILABLE' | 'INVALID_TOOL_INPUT' | 'TRANSACTION_NOT_FOUND';
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
  /**
   * Initialize a financial tools instance with its required dependencies.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
   */
  constructor() {
    super('Financial tool timed out');
    this.name = 'FinancialToolTimeoutError';
  }
}

/**
 * Default dependencies for financial tools.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
 * @returns The resulting financial tools value for the caller.
 */
const defaultDependencies = (): FinancialToolDependencies => ({
  contextBuilder: new ContextBuilderService(),
  budgetService: new BudgetService(),
  savingGoalService: new SavingGoalService(),
  transactionService: new TransactionService(),
});

const defaultLogger: FinancialToolLogger = {
  /**
   * Info for financial tools.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
   * @param event - The UI or runtime event that initiated the operation.
   * @returns The resulting financial tools value for the caller.
   */
  info: (event) => console.info(event),
  /**
   * Error for financial tools.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
   * @param event - The UI or runtime event that initiated the operation.
   * @returns The resulting financial tools value for the caller.
   */
  error: (event) => console.error(event),
};

/**
 * Resolve period from the available financial tools context.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
 * @param month - The date or reporting period used by the operation.
 * @param year - The date or reporting period used by the operation.
 * @returns The resulting financial tools value for the caller.
 */
const resolvePeriod = (month?: number, year?: number) => {
  const now = new Date();
  return {
    month: month ?? now.getMonth() + 1,
    year: year ?? now.getFullYear(),
  };
};

/**
 * Previous period for financial tools.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
 * @param props - The properties that configure this React component.
 * @returns The resulting financial tools value for the caller.
 */
const previousPeriod = ({ month, year }: { month: number; year: number }) => ({
  month: month === 1 ? 12 : month - 1,
  year: month === 1 ? year - 1 : year,
});

/**
 * With timeout for financial tools.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
 * @param operation - The operation value required by the operation.
 * @param timeoutMs - The timeout ms value required by the operation.
 * @returns The resulting financial tools value for the caller.
 */
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

/**
 * Build financial tools used by the financial tools workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
 * @param userId - The identifier of the user whose data is being processed.
 * @param context - The context value required by the operation.
 * @param dependencies - The dependencies value required by the operation.
 * @returns The resulting financial tools value for the caller.
 */
export const buildFinancialTools = (
  userId: string,
  context: FinancialToolContext = {},
  dependencies: FinancialToolDependencies = defaultDependencies(),
) => {
  const timeoutMs = context.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS;
  const logger = context.logger ?? defaultLogger;

  /**
   * Execute safely for the financial tools workflow.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
   * @param toolName - The tool name value required by the operation.
   * @param operation - The operation value required by the operation.
   * @returns A promise containing the resulting financial tools value.
   */
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
      const invalidInput = toolName === 'findTransactions' && error instanceof AppError && error.statusCode === 400;
      const missingTransaction = toolName === 'findTransactions' && error instanceof AppError && error.statusCode === 404;
      const errorCode = timedOut ? 'TOOL_TIMEOUT'
        : invalidInput ? 'INVALID_TOOL_INPUT'
        : missingTransaction ? 'TRANSACTION_NOT_FOUND'
        : 'FINANCIAL_DATA_UNAVAILABLE';
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
            : invalidInput ? 'Invalid search input. Use valid YYYY-MM-DD dates with startDate on or before endDate.'
            : missingTransaction ? 'No accessible transaction matches this ID. Do not guess IDs. Search again with transactionId=null and ask the user to choose from the returned transactions.'
            : 'Financial data is temporarily unavailable. Please try again.',
          retryable: !invalidInput && !missingTransaction,
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
    /**
     * Execute financial tools for the financial tools workflow.
     *
     * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
     * @param props - The properties that configure this React component.
     * @returns A promise containing the resulting financial tools value.
     */
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
    /**
     * Execute financial tools for the financial tools workflow.
     *
     * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
     * @param props - The properties that configure this React component.
     * @returns A promise containing the resulting financial tools value.
     */
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
    /**
     * Execute financial tools for the financial tools workflow.
     *
     * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
     * @param props - The properties that configure this React component.
     * @returns A promise containing the resulting financial tools value.
     */
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
    /**
     * Execute financial tools for the financial tools workflow.
     *
     * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
     * @returns A promise containing the resulting financial tools value.
     */
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
    /**
     * Execute financial tools for the financial tools workflow.
     *
     * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial tools rules.
     * @param props - The properties that configure this React component.
     * @returns A promise containing the resulting financial tools value.
     */
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

  const findTransactions = defineTool({
    name: 'findTransactions',
    description: 'Find existing income/expense transactions belonging to the authenticated user before updating or deleting one. Search notes, wallet names and category names; filter by calendar dates/type, or fetch an exact transactionId. Read-only. Never guess an ID or select an ambiguous match without asking the user.',
    parameters: z.object({
      // Responses API may require every property. Nullable fields let the model
      // leave absent filters unset rather than inventing an ID/date to fill them.
      transactionId: z.string().uuid().nullish().describe('Set null when searching a list. Only use an exact ID returned by an earlier tool or save receipt; NEVER invent an ID.'),
      search: z.string().trim().max(200).nullish().describe('Text in the note, wallet name or category name. Set null for no text filter.'),
      type: z.enum(['INCOME', 'EXPENSE']).nullish().describe('EXPENSE for spending, INCOME for income, null for either.'),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().describe('First calendar day, YYYY-MM-DD. Set null unless the user specifies a period; recent transactions are already sorted newest first.'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().describe('Last calendar day, inclusive, YYYY-MM-DD. Set null for no end date.'),
      limit: z.number().int().min(1).max(20).nullish().describe('Maximum records, default 10 when null.'),
      offset: z.number().int().min(0).max(1_000_000).nullish().describe('Pagination offset, default 0 when null.'),
    }).strict(),
    execute: async ({ transactionId, search, type, startDate, endDate, limit, offset }) => executeSafely('findTransactions', async () => {
      const parseDate = (value: string | null | undefined, endOfDay = false) => {
        if (!value) return undefined;
        const date = new Date(`${value}T00:00:00.000Z`);
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
          throw new AppError('Invalid calendar date', 400);
        }
        if (endOfDay) date.setUTCHours(23, 59, 59, 999);
        return date;
      };
      const start = parseDate(startDate);
      const end = parseDate(endDate, true);
      if (start && end && start > end) throw new AppError('Invalid date range', 400);
      const take = limit ?? 10;
      const skip = offset ?? 0;
      const result = transactionId
        ? { transactions: [await dependencies.transactionService.getTransaction(userId, transactionId)], pagination: { total: 1 } }
        : await dependencies.transactionService.getTransactions(userId, {
            search: search ?? undefined, type: type ?? undefined, startDate: start, endDate: end, take, skip,
            sortBy: 'transactionDate', order: 'desc',
          });
      return {
        transactions: result.transactions.map(transaction => ({
          id: transaction.id,
          version: transaction.version,
          type: transaction.type,
          amount: Number(transaction.amount),
          currency: 'VND',
          date: transaction.transactionDate.toISOString(),
          walletName: transaction.wallet.name,
          categoryName: transaction.category.name,
          note: transaction.note,
          editable: transaction.type !== 'TRANSFER',
        })),
        total: result.pagination.total,
        hasMore: !transactionId && skip + result.transactions.length < result.pagination.total,
      };
    }),
  });

  return [
    getFinancialOverview,
    getExpenseBreakdown,
    getBudgetStatus,
    getSavingGoals,
    compareMonthlySpending,
    findTransactions,
  ];
};
