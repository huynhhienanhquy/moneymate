import { z } from 'zod';

export const createBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional().nullable(),
    amount: z.number().positive('Amount must be positive'),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    categoryId: z.string().uuid().optional().nullable(),
  }),
});
