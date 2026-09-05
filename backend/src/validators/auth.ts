import { z } from 'zod';

export const registerSchema = z
  .object({
    role: z.enum(['CUSTOMER', 'WORKER']),
    fullName: z.string().min(2).max(80),
    email: z.string().email().optional(),
    phone: z
      .string()
      .min(7)
      .max(20)
      .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number')
      .optional(),
    password: z.string().min(8).max(128),
    avatarUrl: z.string().url().optional(),
    city: z.string().max(80).optional(),
    addressLine: z.string().max(200).optional(),
    experienceYears: z.number().int().min(0).max(80).optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Either email or phone is required',
  });

export const loginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(3),
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;