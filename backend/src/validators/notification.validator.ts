import { z } from 'zod';

export const registerDeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().trim().min(1).max(191),
    token: z.string().trim().min(10).max(255),
    platform: z.enum(['ios', 'android']),
    provider: z.enum(['expo', 'fcm', 'apns']).default('expo'),
    appVersion: z.string().trim().max(32).optional(),
    locale: z.string().trim().max(32).optional(),
    timezone: z.string().trim().max(64).optional()
  })
});

export const unregisterDeviceSchema = z.object({
  body: z.object({ deviceId: z.string().trim().min(1).max(191) })
});
