import { z } from 'zod';
import { TransactionType } from '@prisma/client';

export const createTransactionSchema = z.object({
  body: z.object({
    walletId: z.string().uuid('Invalid wallet ID format'),
    categoryId: z.string().uuid('Invalid category ID format'),
    amount: z.number().positive('Amount must be positive and non-zero'),
    type: z.nativeEnum(TransactionType, { errorMap: () => ({ message: 'Invalid transaction type' }) }),
    note: z.string().optional(),
    transactionDate: z.coerce.date({ errorMap: () => ({ message: 'Invalid transaction date format' }) })
  })
});

export const updateTransactionSchema = z.object({
  body: z.object({
    walletId: z.string().uuid('Invalid wallet ID format').optional(),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
    amount: z.number().positive('Amount must be positive and non-zero').optional(),
    type: z.nativeEnum(TransactionType).optional(),
    note: z.string().optional(),
    transactionDate: z.coerce.date().optional(),
    version: z.number().int().positive().optional()
  })
});

export const deleteTransactionSchema = z.object({
  query: z.object({ version: z.coerce.number().int().positive().optional() })
});

export const transactionSyncSchema = z.object({
  query: z.object({
    cursor: z.string().datetime().optional(),
    take: z.coerce.number().int().min(1).max(200).default(100)
  })
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
