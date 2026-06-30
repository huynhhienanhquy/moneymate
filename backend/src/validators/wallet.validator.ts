import { z } from 'zod';
import { WalletType } from '@prisma/client';

export const createWalletSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Wallet name is required'),
    type: z.nativeEnum(WalletType, { errorMap: () => ({ message: 'Invalid wallet type' }) }),
    currency: z.string().optional(),
    initialBalance: z.number().nonnegative('Initial balance must be zero or positive').default(0)
  })
});

export const updateWalletSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Wallet name is required').optional(),
    type: z.nativeEnum(WalletType).optional(),
    initialBalance: z.number().nonnegative('Initial balance must be zero or positive').optional()
  })
});
