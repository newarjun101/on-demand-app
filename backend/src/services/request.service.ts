import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { matchingService } from './matching.service';
import { CreateRequestInput } from '../validators/request';
import { emitToUser } from '../sockets/io';

export const requestService = {
  async create(customerId: string, input: CreateRequestInput) {
    const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
    if (!service || !service.isActive) throw errors.notFound('Service not found');

    const request = await prisma.serviceRequest.create({
      data: {
        customerId,
        serviceId: input.serviceId,
        description: input.description,
        city: input.city,
        addressLine: input.addressLine,
        landmark: input.landmark,
        latitude: input.latitude,
        longitude: input.longitude,
        schedule: input.schedule,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        minBudget: input.minBudget,
        maxBudget: input.maxBudget,
        status: 'FINDING_WORKERS',
        photos: input.photoUrls?.length
          ? { create: input.photoUrls.map((url) => ({ url })) }
          : undefined,
      },
      include: {
        service: { include: { category: true } },
        photos: true,
      },
    });

    // Fire-and-forget matching
    matchingService.findAndNotify(request).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[matching] error:', err?.message);
    });

    return request;
  },

  async listForCustomer(customerId: string, page: number, pageSize: number, status?: string) {
    const where: any = { customerId, deletedAt: null };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          service: { include: { category: true } },
          photos: true,
          _count: { select: { quotes: true } },
          booking: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.serviceRequest.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async listForWorker(workerUserId: string, page: number, pageSize: number, status?: string) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId: workerUserId } });
    if (!profile) throw errors.notFound('Worker profile not found');

    // Requests that match this worker's services AND are within radius.
    const baseWhere: any = { status: 'FINDING_WORKERS', deletedAt: null };
    if (status) baseWhere.status = status;

    const candidates = await prisma.serviceRequest.findMany({
      where: {
        ...baseWhere,
        OR: [
          { service: { workerServices: { some: { workerProfileId: profile.id } } } },
        ],
      },
      include: {
        service: { include: { category: true } },
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        photos: true,
        quotes: { where: { workerId: workerUserId } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // We'll filter then paginate manually
    });

    const filtered = candidates.filter((r) => {
      if (profile.latitude == null || profile.longitude == null) return false;
      const d = haversine(profile.latitude, profile.longitude, r.latitude, r.longitude);
      return d <= profile.serviceRadiusKm;
    });

    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  },

  async getById(id: string) {
    const r = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        service: { include: { category: true } },
        photos: true,
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        quotes: {
          include: {
            worker: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { totalAmount: 'asc' },
        },
        booking: {
          include: {
            worker: { select: { id: true, fullName: true, avatarUrl: true } },
            payment: true,
            review: true,
          },
        },
      },
    });
    if (!r) throw errors.notFound('Request not found');
    return r;
  },

  async cancel(customerId: string, id: string) {
    const r = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!r) throw errors.notFound('Request not found');
    if (r.customerId !== customerId) throw errors.forbidden();
    if (['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED'].includes(r.status)) {
      throw errors.badRequest('Cannot cancel request in current status');
    }
    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status: 'CANCELLED', deletedAt: new Date() },
    });
    // Notify all workers who had quotes
    const quotes = await prisma.quote.findMany({ where: { requestId: id } });
    quotes.forEach((q) => {
      emitToUser(q.workerId, 'request_cancelled', { requestId: id });
    });
    return updated;
  },
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}