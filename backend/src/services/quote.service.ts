import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { CreateQuoteInput } from '../validators/quote';
import { emitToUser } from '../sockets/io';
import { calculateMoney } from '../utils/money';
import { env } from '../config/env';

export const quoteService = {
  async create(workerUserId: string, requestId: string, input: CreateQuoteInput) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { quotes: true },
    });
    if (!request) throw errors.notFound('Request not found');
    if (request.status !== 'FINDING_WORKERS' && request.status !== 'QUOTES_RECEIVED') {
      throw errors.badRequest('Request is no longer accepting quotes');
    }

    const profile = await prisma.workerProfile.findUnique({
      where: { userId: workerUserId },
      include: { services: true },
    });
    if (!profile) throw errors.notFound('Worker profile not found');
    if (profile.verificationStatus !== 'APPROVED') {
      throw errors.forbidden('Worker is not approved yet');
    }
    if (!profile.services.find((s: any) => s.serviceId === request.serviceId)) {
      throw errors.forbidden('You do not offer this service');
    }
    if (request.quotes.some((q) => q.workerId === workerUserId)) {
      throw errors.conflict('You have already quoted this request');
    }

    const subtotal =
      input.laborAmount + input.materialsAmount + input.additionalFee;
    if (subtotal <= 0) throw errors.validation('Total must be greater than zero');

    const quote = await prisma.quote.create({
      data: {
        requestId,
        workerId: workerUserId,
        laborAmount: input.laborAmount,
        materialsAmount: input.materialsAmount,
        additionalFee: input.additionalFee,
        totalAmount: subtotal,
        estimatedMinutes: input.estimatedMinutes,
        message: input.message,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        worker: { select: { id: true, fullName: true, avatarUrl: true } },
        request: { include: { service: true } },
      },
    });

    if (request.status === 'FINDING_WORKERS') {
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: 'QUOTES_RECEIVED' },
      });
    }

    // Notify customer
    emitToUser(request.customerId, 'quote_created', {
      requestId,
      quote: {
        id: quote.id,
        totalAmount: quote.totalAmount,
        workerId: quote.workerId,
        workerName: quote.worker.fullName,
        workerAvatar: quote.worker.avatarUrl,
      },
    });

    // Notify worker dashboard
    emitToUser(workerUserId, 'quote_created', { requestId, quoteId: quote.id });

    return quote;
  },

  async listForRequest(requestId: string, customerId: string) {
    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw errors.notFound('Request not found');
    if (request.customerId !== customerId) throw errors.forbidden();

    return prisma.quote.findMany({
      where: { requestId },
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            workerProfile: {
              select: {
                ratingAverage: true,
                ratingCount: true,
                completedJobs: true,
                experienceYears: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async withdraw(workerUserId: string, quoteId: string) {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw errors.notFound('Quote not found');
    if (quote.workerId !== workerUserId) throw errors.forbidden();
    if (quote.status !== 'PENDING') throw errors.badRequest('Quote cannot be withdrawn');
    return prisma.quote.update({ where: { id: quoteId }, data: { status: 'WITHDRAWN' } });
  },

  async accept(customerId: string, quoteId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { request: true },
    });
    if (!quote) throw errors.notFound('Quote not found');
    if (quote.request.customerId !== customerId) throw errors.forbidden();
    if (quote.status !== 'PENDING') throw errors.badRequest('Quote is no longer pending');

    const money = calculateMoney(quote.totalAmount, env.platformCommissionPercent);

    const result = await prisma.$transaction(async (tx) => {
      // Mark accepted
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
      });
      // Reject all other quotes
      await tx.quote.updateMany({
        where: { requestId: quote.requestId, NOT: { id: quoteId } },
        data: { status: 'REJECTED' },
      });
      // Update request status
      await tx.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: 'QUOTE_ACCEPTED' },
      });
      // Create booking
      const booking = await tx.booking.create({
        data: {
          requestId: quote.requestId,
          quoteId: updatedQuote.id,
          customerId: quote.request.customerId,
          workerId: quote.workerId,
          status: 'CONFIRMED',
          scheduledAt: quote.request.scheduledAt,
          subtotal: money.subtotal,
          platformFee: money.platformFee,
          workerEarnings: money.workerEarnings,
          total: money.total,
          commissionPercent: money.commissionPercent,
        },
      });
      // Request status now booking confirmed
      await tx.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: 'BOOKING_CONFIRMED' },
      });
      return booking;
    });

    // Notify worker
    emitToUser(quote.workerId, 'quote_accepted', {
      quoteId,
      requestId: quote.requestId,
      bookingId: result.id,
    });
    // Notify other workers
    const others = await prisma.quote.findMany({
      where: { requestId: quote.requestId, NOT: { id: quoteId } },
    });
    others.forEach((q) => {
      emitToUser(q.workerId, 'quote_rejected', { quoteId: q.id, requestId: quote.requestId });
    });

    return result;
  },

  async reject(customerId: string, quoteId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { request: true },
    });
    if (!quote) throw errors.notFound('Quote not found');
    if (quote.request.customerId !== customerId) throw errors.forbidden();
    if (quote.status !== 'PENDING') throw errors.badRequest('Quote already handled');
    return prisma.quote.update({ where: { id: quoteId }, data: { status: 'REJECTED' } });
  },
};