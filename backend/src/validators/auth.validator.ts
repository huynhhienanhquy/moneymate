import { z } from 'zod';
import { loginRequestSchema } from '@moneymate/validation';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    fullName: z.string().min(1, 'Full name is required')
  })
});

export const loginSchema = z.object({
  body: loginRequestSchema
});
