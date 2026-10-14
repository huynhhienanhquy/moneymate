import { z } from 'zod';

export const updateTransactionToolDefinition = {
  name: 'updateTransaction',
  description: 'Prepare changes to one existing income/expense transaction and ask the user to confirm. Call findTransactions first and use its real ID. Send only fields the user wants to change. Never edit a transfer.',
  parameters: z.object({
    transactionId: z.string().uuid().describe('Existing transaction ID returned by findTransactions.'),
    amount: z.number().positive().optional().describe('New amount in VND; omit to keep the original.'),
    type: z.enum(['INCOME', 'EXPENSE']).optional().describe('New type; omit to keep the original.'),
    walletName: z.string().min(1).optional().describe('Exact new wallet name; omit to keep the original.'),
    categoryName: z.string().min(1).optional().describe('Exact new category name matching the resulting type; omit to keep the original.'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('New calendar date YYYY-MM-DD; omit to keep the original.'),
    note: z.string().max(500).optional().describe('New note. Empty string clears it; omit to keep the original.'),
  }),
};

export const deleteTransactionToolDefinition = {
  name: 'deleteTransaction',
  description: 'Show one existing income/expense transaction and ask the user to confirm deletion. Call findTransactions first and use its real ID. Never delete a transfer.',
  parameters: z.object({
    transactionId: z.string().uuid().describe('Existing transaction ID returned by findTransactions.'),
  }),
};

export type UpdateTransactionDraft = z.infer<typeof updateTransactionToolDefinition.parameters>;
