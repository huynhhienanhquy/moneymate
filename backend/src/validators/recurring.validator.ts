import { z } from 'zod';
import { CategoryType, Frequency } from '@prisma/client';

export const createRecurringSchema = z.object({
  body: z.object({
    walletId: z.string().uuid(),
    categoryId: z.string().uuid(),
    amount: z.number().positive(),
    type: z.nativeEnum(CategoryType),
    frequency: z.nativeEnum(Frequency),
    note: z.string().optional(),
    startDate: z.coerce.date(),
  }),
});

export const updateRecurringSchema = z.object({
  body: z.object({
    walletId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    type: z.nativeEnum(CategoryType).optional(),
    frequency: z.nativeEnum(Frequency).optional(),
    note: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});
