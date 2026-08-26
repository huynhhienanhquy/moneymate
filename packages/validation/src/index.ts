import { z } from 'zod';

export const clientPlatformSchema = z.enum(['web', 'ios', 'android']);

export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  platform: clientPlatformSchema.default('web'),
  deviceId: z.string().trim().min(1).max(191).optional(),
  deviceName: z.string().trim().min(1).max(191).optional(),
  appVersion: z.string().trim().min(1).max(32).optional(),
  timezone: z.string().trim().min(1).max(64).optional()
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
