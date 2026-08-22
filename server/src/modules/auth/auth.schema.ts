import { z } from 'zod';

/**
 * Password policy: length is the dominant factor in resistance to offline
 * cracking, so the minimum is 10 rather than the more common 8, with a single
 * composition rule instead of the usual four. This is deliberately usable on a
 * low-end phone keyboard, which is the primary device for these users.
 */
const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
    message: 'Password must contain at least one letter and one number',
  });

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(255);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: emailSchema,
    phone: phoneSchema.optional(),
    password: passwordSchema,
    role: z.enum(['STUDENT', 'PARENT']).default('STUDENT'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(128),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password',
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
