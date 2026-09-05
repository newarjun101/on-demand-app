import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { CreateReviewInput } from '../validators/review';
import { emitToUser } from '../sockets/io';

export const reviewService = {
  async create(customerId: string, bookingId: string, input: CreateReviewInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });
    if (!booking) throw errors.notFound('Booking not found');
    if (booking.customerId !== customerId) throw errors.forbidden();
    if (booking.status !== 'COMPLETED') {
      throw errors.badRequest('Only completed bookings can be reviewed');
    }
    if (booking.review) throw errors.conflict('Booking already reviewed');

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId,
          authorId: customerId,
          subjectId: booking.workerId,
          rating: input.rating,
          comment: input.comment,
          photos: input.photos ?? [],
        },
      });
      // Recalculate worker rating
      const aggregate = await tx.review.aggregate({
        where: { subjectId: booking.workerId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.workerProfile.update({
        where: { userId: booking.workerId },
        data: {
          ratingAverage: aggregate._avg.rating ?? 0,
          ratingCount: aggregate._count.rating,
        },
      });
      return created;
    });

    emitToUser(booking.workerId, 'review_received', {
      bookingId,
      rating: input.rating,
    });

    return review;
  },

  async listForWorker(workerUserId: string, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: { subjectId: workerUserId },
        include: {
          author: { select: { fullName: true, avatarUrl: true } },
          booking: { include: { request: { include: { service: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where: { subjectId: workerUserId } }),
    ]);
    return { items, total, page, pageSize };
  },
};