import { prisma } from '../config/prisma';
import { errors } from '../utils/api';

export const favoriteService = {
  async add(userId: string, workerProfileId: string) {
    const profile = await prisma.workerProfile.findUnique({ where: { id: workerProfileId } });
    if (!profile) throw errors.notFound('Worker not found');
    return prisma.favorite.upsert({
      where: { userId_workerProfileId: { userId, workerProfileId } },
      update: {},
      create: { userId, workerProfileId },
    });
  },

  async remove(userId: string, workerProfileId: string) {
    return prisma.favorite.deleteMany({
      where: { userId, workerProfileId },
    });
  },

  async list(userId: string) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        workerProfile: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
            services: { include: { service: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};