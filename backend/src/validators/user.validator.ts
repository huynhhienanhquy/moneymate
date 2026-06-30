import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    avatarUrl: z.preprocess(
      (val) => (val === '' ? null : val),
      z.string().url('Invalid avatar URL').optional().nullable()
    ),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});
