import { prisma } from '../config/prisma';
import { errors } from '../utils/api';

export const disputeService = {
  async open(userId: string, bookingId: string, reason: string, description: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw errors.notFound('Booking not found');
    if (booking.customerId !== userId && booking.workerId !== userId) throw errors.forbidden();
    return prisma.dispute.upsert({
      where: { bookingId },
      update: { reason, description },
      create: { bookingId, openerId: userId, reason, description },
    });
  },

  async listMine(userId: string) {
    return prisma.dispute.findMany({
      where: { openerId: userId },
      include: {
        booking: {
          include: {
            request: { include: { service: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};