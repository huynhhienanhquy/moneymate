import { z } from 'zod';

export const expenseToolDefinition = {
  name: 'recordExpense',
  description: 'Prepare an expense for the user to review, select a wallet/category, and explicitly save. Use when the user reports spending, such as "hôm nay ăn uống hết 12 đ". Does not save until the user clicks confirmation. Amount is in VND: 12 đ = 12, 12k = 12000. Never assume an unspecified amount. Leave unknown wallet/category names empty.',
  parameters: z.object({
    // The installed runtime converts JSON Schema to Zod but cannot convert null.
    amount: z.number().positive().optional().describe('Exact amount in VND. Omit if missing or ambiguous so the user can enter it.'),
    categoryName: z.string().describe('Suggested category name, e.g. Ăn uống, or empty if unknown.'),
    walletName: z.string().describe('Wallet name only if the user specified it, otherwise empty.'),
    note: z.string().describe('Short expense description from the user, in Vietnamese.'),
    date: z.string().describe('Local calendar date YYYY-MM-DD. Resolve hôm nay/hôm qua using the current local date in app context. Empty if unknown.'),
  }),
};

export type ExpenseDraft = Partial<z.infer<typeof expenseToolDefinition.parameters>>;
