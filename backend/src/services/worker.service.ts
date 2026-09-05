import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { distanceKm } from '../utils/geo';
import { z } from 'zod';
import {
  updateWorkerProfileSchema,
  upsertServiceSchema,
  upsertAvailabilitySchema,
  setOnlineSchema,
  workerSearchSchema,
} from '../validators/worker';
import { emitToUser } from '../sockets/io';

export const workerService = {
  async getPublicProfile(idOrSlug: string) {
    const profile = await prisma.workerProfile.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { user: { id: idOrSlug } }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            createdAt: true,
            reviewsReceived: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                author: { select: { fullName: true, avatarUrl: true } },
                booking: {
                  include: {
                    request: { include: { service: true } },
                  },
                },
              },
            },
            _count: { select: { reviewsReceived: true } },
          },
        },
        services: { include: { service: { include: { category: true } } } },
        portfolio: true,
      },
    });
    if (!profile) throw errors.notFound('Worker not found');
    // Don't expose live location unless actively working
    return {
      ...profile,
      liveLatitude: undefined,
      liveLongitude: undefined,
    };
  },

  async search(query: z.infer<typeof workerSearchSchema>) {
    const {
      q,
      service,
      category,
      city,
      minRating,
      maxPrice,
      verifiedOnly,
      emergency,
      sort,
      page,
      pageSize,
      latitude,
      longitude,
    } = query;

    const where: any = {
      verificationStatus: 'APPROVED',
      isAcceptingJobs: true,
    };

    if (q) {
      where.user = {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      };
    }
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (minRating !== undefined) where.ratingAverage = { gte: minRating };
    if (emergency) where.emergencyAvailable = true;
    if (verifiedOnly) where.verificationStatus = 'APPROVED';

    if (service || category) {
      where.services = {
        some: {
          service: {
            isActive: true,
            ...(service ? { slug: service } : undefined),
            ...(category ? { category: { slug: category } } : undefined),
          },
        },
      };
    }

    if (maxPrice !== undefined) {
      where.services = {
        some: {
          OR: [
            { startingPrice: { lte: maxPrice } },
            { hourlyRate: { lte: maxPrice } },
            { fixedPrice: { lte: maxPrice } },
          ],
        },
      };
    }

    const [total, profiles] = await Promise.all([
      prisma.workerProfile.count({ where }),
      prisma.workerProfile.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          services: {
            include: { service: { include: { category: true } } },
          },
          portfolio: { take: 3 },
        },
        orderBy: { ratingAverage: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    let items = profiles.map((p) => {
      let distanceKmValue: number | null = null;
      if (latitude !== undefined && longitude !== undefined && p.latitude && p.longitude) {
        distanceKmValue = distanceKm(latitude, longitude, p.latitude, p.longitude);
      }
      const startingPrice = p.services
        .map((s) => s.startingPrice ?? s.fixedPrice ?? s.hourlyRate ?? 0)
        .filter((n) => n > 0);
      const minPrice = startingPrice.length ? Math.min(...startingPrice) : null;

      return {
        id: p.id,
        userId: p.userId,
        name: p.user.fullName,
        avatarUrl: p.user.avatarUrl,
        verified: p.verificationStatus === 'APPROVED',
        ratingAverage: p.ratingAverage,
        ratingCount: p.ratingCount,
        experienceYears: p.experienceYears,
        completedJobs: p.completedJobs,
        city: p.city,
        startingPrice: minPrice,
        services: p.services.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          slug: s.service.slug,
          pricingType: s.pricingType,
          startingPrice: s.startingPrice,
          hourlyRate: s.hourlyRate,
          fixedPrice: s.fixedPrice,
          category: s.service.category?.name,
        })),
        distanceKm: distanceKmValue,
        emergencyAvailable: p.emergencyAvailable,
        portfolio: p.portfolio.map((i) => i.imageUrl),
      };
    });

    // Sorting
    items.sort((a, b) => {
      switch (sort) {
        case 'NEAREST':
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        case 'HIGHEST_RATED':
          return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0);
        case 'LOWEST_PRICE':
          return (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity);
        case 'MOST_EXPERIENCED':
          return (b.experienceYears ?? 0) - (a.experienceYears ?? 0);
        case 'RECOMMENDED':
        default:
          const aScore =
            (a.ratingAverage ?? 0) * 2 +
            Math.max(0, 5 - (a.distanceKm ?? 10)) * 0.5 +
            Math.min(a.experienceYears ?? 0, 10) * 0.3 +
            Math.min(a.completedJobs ?? 0, 50) * 0.05;
          const bScore =
            (b.ratingAverage ?? 0) * 2 +
            Math.max(0, 5 - (b.distanceKm ?? 10)) * 0.5 +
            Math.min(b.experienceYears ?? 0, 10) * 0.3 +
            Math.min(b.completedJobs ?? 0, 50) * 0.05;
          return bScore - aScore;
      }
    });

    return { items, total, page, pageSize };
  },

  async updateOwnProfile(userId: string, input: z.infer<typeof updateWorkerProfileSchema>) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    const updated = await prisma.workerProfile.update({
      where: { userId },
      data: input,
    });
    return updated;
  },

  async upsertService(userId: string, input: z.infer<typeof upsertServiceSchema>) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    const ws = await prisma.workerService.upsert({
      where: {
        workerProfileId_serviceId: {
          workerProfileId: profile.id,
          serviceId: input.serviceId,
        },
      },
      update: {
        pricingType: input.pricingType,
        startingPrice: input.startingPrice,
        hourlyRate: input.hourlyRate,
        fixedPrice: input.fixedPrice,
        estimatedMinutes: input.estimatedMinutes,
        emergencyAvailable: input.emergencyAvailable,
        description: input.description,
      },
      create: {
        workerProfileId: profile.id,
        serviceId: input.serviceId,
        pricingType: input.pricingType,
        startingPrice: input.startingPrice,
        hourlyRate: input.hourlyRate,
        fixedPrice: input.fixedPrice,
        estimatedMinutes: input.estimatedMinutes,
        emergencyAvailable: input.emergencyAvailable,
        description: input.description,
      },
      include: { service: true },
    });
    return ws;
  },

  async removeService(userId: string, serviceId: string) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    await prisma.workerService.delete({
      where: { workerProfileId_serviceId: { workerProfileId: profile.id, serviceId } },
    });
  },

  async upsertAvailability(userId: string, input: z.infer<typeof upsertAvailabilitySchema>) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    const ops = input.entries.map((e) =>
        prisma.workerAvailability.upsert({
          where: { workerProfileId_day: { workerProfileId: profile.id, day: e.day as any } },
          update: { isAvailable: e.isAvailable, startTime: e.startTime, endTime: e.endTime },
          create: {
            workerProfileId: profile.id,
            day: e.day as any,
            isAvailable: e.isAvailable,
            startTime: e.startTime,
            endTime: e.endTime,
          },
        }),
      );
    const result = await prisma.$transaction(ops);
    return result;
  },

  async setOnline(userId: string, input: z.infer<typeof setOnlineSchema>) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    const updated = await prisma.workerProfile.update({
      where: { userId },
      data: {
        isOnline: input.isOnline,
        isAcceptingJobs: input.isAcceptingJobs ?? input.isOnline,
      },
    });
    emitToUser(userId, 'worker:status', {
      userId,
      isOnline: updated.isOnline,
      isAcceptingJobs: updated.isAcceptingJobs,
    });
    return updated;
  },

  async updateLiveLocation(userId: string, lat: number, lng: number) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    return prisma.workerProfile.update({
      where: { userId },
      data: { liveLatitude: lat, liveLongitude: lng, liveLocationAt: new Date() },
    });
  },
};