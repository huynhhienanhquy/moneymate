import { z } from 'zod';
import { TransactionType } from '@prisma/client';

const editableTransactionType = z.enum([TransactionType.INCOME, TransactionType.EXPENSE]);
const notInFuture = (date: Date) => date.getTime() <= Date.now();
const calendarDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }, 'Invalid calendar date');
const queryDate = z.union([
  calendarDate,
  z.string().trim().datetime({ offset: true }),
]).transform((value) => new Date(value));
const reportYear = z.coerce.number().int().min(1970).max(9999);

export const createTransactionSchema = z.object({
  body: z.object({
    walletId: z.string().uuid('Invalid wallet ID format'),
    categoryId: z.string().uuid('Invalid category ID format'),
    amount: z.number().positive('Amount must be positive and non-zero'),
    type: editableTransactionType,
    note: z.string().optional(),
    transactionDate: z.coerce.date({ errorMap: () => ({ message: 'Invalid transaction date format' }) })
      .refine(notInFuture, 'Transaction date cannot be in the future')
  })
});

export const updateTransactionSchema = z.object({
  body: z.object({
    walletId: z.string().uuid('Invalid wallet ID format').optional(),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
    amount: z.number().positive('Amount must be positive and non-zero').optional(),
    type: editableTransactionType.optional(),
    note: z.string().optional(),
    transactionDate: z.coerce.date().refine(notInFuture, 'Transaction date cannot be in the future').optional(),
    version: z.number().int().positive().optional()
  })
});

export const deleteTransactionSchema = z.object({
  query: z.object({ version: z.coerce.number().int().positive().optional() })
});

export const transactionSyncSchema = z.object({
  query: z.object({
    cursor: z.string().min(1).max(1024).optional(),
    take: z.coerce.number().int().min(1).max(200).default(100)
  })
});

export const transactionListSchema = z.object({
  query: z.object({
    walletId: z.string().uuid('Invalid wallet ID format').optional(),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
    type: z.nativeEnum(TransactionType).optional(),
    startDate: queryDate.optional(),
    endDate: queryDate.optional(),
    search: z.string().trim().max(200).optional(),
    sortBy: z.enum(['transactionDate', 'amount', 'createdAt', 'updatedAt', 'type']).default('transactionDate'),
    order: z.enum(['asc', 'desc']).default('desc'),
    skip: z.coerce.number().int().min(0).max(1_000_000).default(0),
    take: z.coerce.number().int().min(1).max(200).default(20),
  }).superRefine((query, context) => {
    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after start date',
      });
    }
  }),
});

export const monthlyReportQuerySchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: reportYear.optional(),
  }),
});

export const yearlyReportQuerySchema = z.object({
  query: z.object({ year: reportYear.optional() }),
});

export const monthlyTrendQuerySchema = z.object({
  query: z.object({ months: z.coerce.number().int().min(1).max(12).default(6) }),
});

export const walletTransferSchema = z.object({
  body: z.object({
    sourceWalletId: z.string().uuid('Invalid source wallet ID format'),
    destinationWalletId: z.string().uuid('Invalid destination wallet ID format'),
    amount: z.number().positive('Amount must be positive and non-zero'),
    note: z.string().optional(),
    transferDate: z.coerce.date({ errorMap: () => ({ message: 'Invalid transfer date format' }) })
  })
});
