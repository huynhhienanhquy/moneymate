import { z } from 'zod';
import { CategoryType } from '@prisma/client';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    type: z.nativeEnum(CategoryType, { errorMap: () => ({ message: 'Invalid category type' }) }),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color code').optional(),
    icon: z.string().min(1, 'Icon name is required').optional()
  })
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color code').optional(),
    icon: z.string().min(1, 'Icon name is required').optional()
  })
});
