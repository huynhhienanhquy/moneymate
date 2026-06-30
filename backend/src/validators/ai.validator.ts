import { z } from 'zod';

export const analyzeExpensesSchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  }).optional(),
  query: z.object({
    month: z.string().optional(),
    year: z.string().optional(),
  }).optional(),
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(1000),
    history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional(),
  }),
});
