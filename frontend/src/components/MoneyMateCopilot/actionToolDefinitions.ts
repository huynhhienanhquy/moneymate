import { z } from 'zod';

const transactionType = z.enum(['EXPENSE', 'INCOME']);
const walletType = z.enum(['CASH', 'BANK', 'E_WALLET']);
const frequency = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);

export const createCategoryToolDefinition = {
  name: 'createCategory',
  description:
    'Prepare a new income or expense category and ask the user to confirm before saving it. Use when the user asks to add or create a category.',
  parameters: z.object({
    name: z.string().min(1).describe('Category name in Vietnamese.'),
    type: transactionType.describe(
      'EXPENSE for an expense category or INCOME for an income category.',
    ),
    color: z
      .string()
      .optional()
      .describe(
        'Optional six-digit HEX color. Omit when the user does not specify one.',
      ),
    icon: z
      .string()
      .optional()
      .describe('Optional MoneyMate icon name. Omit when unknown.'),
  }),
};

export const createWalletToolDefinition = {
  name: 'createWallet',
  description:
    'Prepare a new wallet/account and ask the user to confirm before saving it.',
  parameters: z.object({
    name: z.string().min(1).describe('Wallet name.'),
    type: walletType.describe('CASH, BANK, or E_WALLET.'),
    initialBalance: z
      .number()
      .nonnegative()
      .optional()
      .describe('Opening balance in VND. Defaults to zero.'),
  }),
};

export const createBudgetToolDefinition = {
  name: 'createBudget',
  description:
    'Prepare a monthly budget and ask the user to confirm before saving it.',
  parameters: z.object({
    amount: z.number().positive().describe('Budget limit in VND.'),
    categoryName: z
      .string()
      .describe(
        'Exact category name, or an empty string for an overall budget.',
      ),
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .describe('Budget month from 1 to 12.'),
    year: z
      .number()
      .int()
      .min(2000)
      .max(2100)
      .describe('Four-digit budget year.'),
  }),
};

export const createSavingGoalToolDefinition = {
  name: 'createSavingGoal',
  description:
    'Prepare a saving goal and ask the user to confirm before saving it.',
  parameters: z.object({
    title: z.string().min(1).describe('Saving goal title.'),
    targetAmount: z.number().positive().describe('Target amount in VND.'),
    targetDate: z
      .string()
      .describe('Target calendar date in YYYY-MM-DD format.'),
  }),
};

export const createRecurringToolDefinition = {
  name: 'createRecurringTransaction',
  description:
    'Prepare a recurring income or expense and ask the user to confirm before saving it. Ask for missing amount, wallet, category, frequency, or start date before calling this tool.',
  parameters: z.object({
    amount: z.number().positive().describe('Recurring amount in VND.'),
    type: transactionType.describe(
      'EXPENSE for recurring spending or INCOME for recurring income.',
    ),
    frequency: frequency.describe('DAILY, WEEKLY, MONTHLY, or YEARLY.'),
    walletName: z.string().min(1).describe('Exact wallet name.'),
    categoryName: z
      .string()
      .min(1)
      .describe('Exact category name matching the transaction type.'),
    note: z
      .string()
      .describe(
        'Short description, or an empty string when no note is needed.',
      ),
    startDate: z.string().describe('Start date in YYYY-MM-DD format.'),
  }),
};

export const recordIncomeToolDefinition = {
  name: 'recordIncome',
  description:
    'Prepare an income transaction and ask the user to confirm before saving it. Use when the user reports receiving money.',
  parameters: z.object({
    amount: z.number().positive().describe('Income amount in VND.'),
    walletName: z.string().min(1).describe('Exact wallet name.'),
    categoryName: z.string().min(1).describe('Exact income category name.'),
    note: z.string().describe('Short income description, or an empty string.'),
    date: z.string().describe('Transaction date in YYYY-MM-DD format.'),
  }),
};

export const transferFundsToolDefinition = {
  name: 'transferFunds',
  description:
    'Prepare a transfer between two MoneyMate wallets and ask the user to confirm before sending it.',
  parameters: z.object({
    sourceWalletName: z.string().min(1).describe('Exact source wallet name.'),
    destinationWalletName: z
      .string()
      .min(1)
      .describe('Exact destination wallet name.'),
    amount: z.number().positive().describe('Transfer amount in VND.'),
    note: z.string().describe('Transfer note, or an empty string.'),
    date: z.string().describe('Transfer date in YYYY-MM-DD format.'),
  }),
};

export type CreateCategoryDraft = z.infer<
  typeof createCategoryToolDefinition.parameters
>;
export type CreateWalletDraft = z.infer<
  typeof createWalletToolDefinition.parameters
>;
export type CreateBudgetDraft = z.infer<
  typeof createBudgetToolDefinition.parameters
>;
export type CreateSavingGoalDraft = z.infer<
  typeof createSavingGoalToolDefinition.parameters
>;
export type CreateRecurringDraft = z.infer<
  typeof createRecurringToolDefinition.parameters
>;
export type RecordIncomeDraft = z.infer<
  typeof recordIncomeToolDefinition.parameters
>;
export type TransferFundsDraft = z.infer<
  typeof transferFundsToolDefinition.parameters
>;
