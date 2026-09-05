import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  avatarUrl: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});