import { z } from 'zod';

export const createSavingGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    targetAmount: z.number().positive('Target amount must be positive'),
    targetDate: z.coerce.date(),
  }),
});

export const updateSavingGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    targetAmount: z.number().positive().optional(),
    targetDate: z.coerce.date().optional(),
  }),
});

export const goalTransactionSchema = z.object({
  body: z.object({
    walletId: z.string().uuid(),
    amount: z.number().positive('Amount must be positive'),
  }),
});
