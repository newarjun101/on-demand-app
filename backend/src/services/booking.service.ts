import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { emitToUser, emitToUsers } from '../sockets/io';
import { UpdateBookingStatusInput } from '../validators/booking';
import { BookingStatus } from '@prisma/client';

// Valid status transitions
const transitions: Record<BookingStatus, BookingStatus[]> = {
  CONFIRMED: ['ON_THE_WAY', 'CANCELLED', 'DISPUTED'],
  ON_THE_WAY: ['ARRIVED', 'CANCELLED', 'DISPUTED'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: [],
};

export const bookingService = {
  async listForCustomer(customerId: string, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where: { customerId },
        include: {
          worker: { select: { id: true, fullName: true, avatarUrl: true } },
          request: { include: { service: { include: { category: true } } } },
          payment: true,
          review: { include: { author: { select: { id: true, fullName: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.booking.count({ where: { customerId } }),
    ]);
    return { items, total, page, pageSize };
  },

  async listForWorker(workerUserId: string, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where: { workerId: workerUserId },
        include: {
          customer: { select: { id: true, fullName: true, avatarUrl: true } },
          request: { include: { service: { include: { category: true } } } },
          payment: true,
          review: { include: { author: { select: { id: true, fullName: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.booking.count({ where: { workerId: workerUserId } }),
    ]);
    return { items, total, page, pageSize };
  },

  async getById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            workerProfile: { select: { ratingAverage: true, completedJobs: true } },
          },
        },
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        request: { include: { service: { include: { category: true } }, photos: true } },
        quote: true,
        payment: true,
        review: { include: { author: { select: { id: true, fullName: true, avatarUrl: true } } } },
      },
    });
    if (!booking) throw errors.notFound('Booking not found');
    return booking;
  },

  async updateStatus(workerUserId: string, id: string, input: UpdateBookingStatusInput) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw errors.notFound('Booking not found');
    if (booking.workerId !== workerUserId) throw errors.forbidden();

    const allowed = transitions[booking.status] || [];
    if (!allowed.includes(input.status as BookingStatus)) {
      throw errors.badRequest(`Cannot transition from ${booking.status} to ${input.status}`);
    }

    const now = new Date();
    const data: any = { status: input.status };
    if (input.status === 'ON_THE_WAY') data.startedAt = now;
    if (input.status === 'ARRIVED') data.arrivedAt = now;
    if (input.status === 'COMPLETED') data.completedAt = now;
    if (input.status === 'CANCELLED') data.cancelledAt = now;

    const updated = await prisma.booking.update({ where: { id }, data });

    if (input.latitude !== undefined && input.longitude !== undefined) {
      await prisma.workerProfile.update({
        where: { userId: workerUserId },
        data: {
          liveLatitude: input.latitude,
          liveLongitude: input.longitude,
          liveLocationAt: now,
        },
      });
    }

    if (input.status === 'COMPLETED') {
      // Update completed jobs counter
      await prisma.workerProfile.update({
        where: { userId: workerUserId },
        data: { completedJobs: { increment: 1 } },
      });
      // Clear live location
      await prisma.workerProfile.update({
        where: { userId: workerUserId },
        data: { liveLatitude: null, liveLongitude: null, liveLocationAt: null },
      });
    }

    emitToUsers([booking.customerId, workerUserId], 'booking_status_changed', {
      bookingId: updated.id,
      status: updated.status,
    });

    return updated;
  },

  async cancel(customerId: string, id: string, reason?: string) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw errors.notFound('Booking not found');
    if (booking.customerId !== customerId) throw errors.forbidden();
    if (!['CONFIRMED', 'ON_THE_WAY', 'ARRIVED'].includes(booking.status)) {
      throw errors.badRequest('Booking cannot be cancelled in current status');
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    emitToUsers([booking.customerId, booking.workerId], 'booking_status_changed', {
      bookingId: updated.id,
      status: 'CANCELLED',
      reason,
    });
    return updated;
  },

  async pay(customerId: string, bookingId: string, method: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw errors.notFound('Booking not found');
    if (booking.customerId !== customerId) throw errors.forbidden();
    if (booking.status !== 'COMPLETED') {
      throw errors.badRequest('Booking must be completed before payment');
    }
    const existing = await prisma.payment.findUnique({ where: { bookingId } });
    if (existing && existing.status === 'PAID') throw errors.badRequest('Already paid');

    // Cash on completion: mark PAID immediately. Gateway-based flows
    // would do an async callback.
    const payment = await prisma.payment.upsert({
      where: { bookingId },
      update: {
        status: 'PAID',
        paidAt: new Date(),
        method: method as any,
      },
      create: {
        bookingId,
        payerId: customerId,
        receiverId: booking.workerId,
        amount: booking.total,
        method: method as any,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    emitToUsers([booking.customerId, booking.workerId], 'payment_updated', {
      bookingId,
      payment,
    });

    return payment;
  },
};