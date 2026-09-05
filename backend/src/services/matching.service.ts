import { prisma } from '../config/prisma';
import { distanceKm } from '../utils/geo';
import { emitToUser } from '../sockets/io';
import { ServiceRequest } from '@prisma/client';
import { errors } from '../utils/api';

export const matchingService = {
  async findAndNotify(request: ServiceRequest) {
    const service = await prisma.service.findUnique({
      where: { id: request.serviceId },
      include: { category: true },
    });
    if (!service) return [];

    const candidates = await prisma.workerProfile.findMany({
      where: {
        verificationStatus: 'APPROVED',
        isAcceptingJobs: true,
        services: { some: { serviceId: service.id } },
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        services: true,
      },
    });

    const filtered = candidates.filter((w) => {
      if (!w.latitude || !w.longitude) return false;
      const d = distanceKm(request.latitude, request.longitude, w.latitude, w.longitude);
      return d <= w.serviceRadiusKm;
    });

    const ranked = filtered
      .map((w) => {
        const d = distanceKm(request.latitude, request.longitude, w.latitude!, w.longitude!);
        const score =
          w.ratingAverage * 2 +
          Math.max(0, 5 - d) * 0.5 +
          Math.min(w.experienceYears, 10) * 0.3 +
          Math.min(w.completedJobs, 50) * 0.05 +
          w.responseRate * 0.2;
        return { worker: w, distance: d, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    // Notify each matched worker in real time
    ranked.forEach(({ worker, distance }) => {
      emitToUser(worker.userId, 'request_received', {
        requestId: request.id,
        service: { id: service.id, name: service.name, slug: service.slug },
        category: service.category.name,
        description: request.description,
        city: request.city,
        distanceKm: Math.round(distance * 10) / 10,
        schedule: request.schedule,
        scheduledAt: request.scheduledAt,
        budget:
          request.minBudget != null || request.maxBudget != null
            ? { min: request.minBudget, max: request.maxBudget }
            : null,
      });
    });

    return ranked;
  },

  async notifySpecificWorker(workerId: string, payload: any) {
    emitToUser(workerId, 'request_received', payload);
  },
};