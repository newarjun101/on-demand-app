import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password';
import { updateProfileSchema, changePasswordSchema } from '../validators/user';
import { z } from 'zod';

export const userService = {
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: {
          include: {
            services: { include: { service: { include: { category: true } } } },
          },
        },
      },
    });
    if (!user) throw errors.notFound('User not found');
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  },

  async updateProfile(userId: string, input: z.infer<typeof updateProfileSchema>) {
    if (input.email) {
      const exists = await prisma.user.findFirst({
        where: { email: input.email, NOT: { id: userId } },
      });
      if (exists) throw errors.conflict('Email already in use');
    }
    if (input.phone) {
      const exists = await prisma.user.findFirst({
        where: { phone: input.phone, NOT: { id: userId } },
      });
      if (exists) throw errors.conflict('Phone already in use');
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
      },
    });
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  },

  async changePassword(
    userId: string,
    input: z.infer<typeof changePasswordSchema>,
  ) {
    const pwdError = validatePassword(input.newPassword);
    if (pwdError) throw errors.validation(pwdError);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw errors.notFound('User not found');
    const ok = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!ok) throw errors.badRequest('Current password is incorrect');
    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshTokenHash: null },
    });
  },
};