import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { WorkerVerificationStatus } from '@prisma/client';

export const adminService = {
  // ===== Workers =====
  async listWorkers(opts: { status?: WorkerVerificationStatus; page: number; pageSize: number }) {
    const where: any = {};
    if (opts.status) where.verificationStatus = opts.status;
    const [items, total] = await Promise.all([
      prisma.workerProfile.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, isActive: true } },
          services: { include: { service: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
      prisma.workerProfile.count({ where }),
    ]);
    return { items, total, page: opts.page, pageSize: opts.pageSize };
  },

  async approveWorker(workerUserId: string) {
    return prisma.workerProfile.update({
      where: { userId: workerUserId },
      data: { verificationStatus: 'APPROVED', verifiedAt: new Date(), rejectionReason: null },
    });
  },

  async rejectWorker(workerUserId: string, reason: string) {
    return prisma.workerProfile.update({
      where: { userId: workerUserId },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason },
    });
  },

  async suspendWorker(workerUserId: string) {
    return prisma.workerProfile.update({
      where: { userId: workerUserId },
      data: { verificationStatus: 'SUSPENDED' },
    });
  },

  // ===== Customers =====
  async listCustomers(page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: {
          id: true, fullName: true, email: true, phone: true, avatarUrl: true,
          isActive: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    return { items, total, page, pageSize };
  },

  async setUserActive(userId: string, isActive: boolean) {
    return prisma.user.update({ where: { id: userId }, data: { isActive } });
  },

  // ===== Categories =====
  async createCategory(name: string, slug: string, description?: string, icon?: string) {
    return prisma.serviceCategory.create({
      data: { name, slug, description, icon },
    });
  },

  async updateCategory(id: string, data: { name?: string; description?: string; icon?: string; isActive?: boolean; sortOrder?: number }) {
    return prisma.serviceCategory.update({ where: { id }, data });
  },

  async deleteCategory(id: string) {
    // soft delete via isActive=false
    return prisma.serviceCategory.update({ where: { id }, data: { isActive: false } });
  },

  // ===== Services =====
  async createService(categoryId: string, name: string, slug: string, description?: string) {
    return prisma.service.create({ data: { categoryId, name, slug, description } });
  },

  async updateService(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    return prisma.service.update({ where: { id }, data });
  },

  // ===== Analytics =====
  async analytics() {
    const [
      totalCustomers,
      totalWorkers,
      pendingWorkers,
      totalRequests,
      activeBookings,
      completedBookings,
      totalRevenueAgg,
      totalPlatformFeeAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.workerProfile.count(),
      prisma.workerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.serviceRequest.count(),
      prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'] } } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.booking.aggregate({ _sum: { platformFee: true }, where: { status: 'COMPLETED' } }),
    ]);
    return {
      totalCustomers,
      totalWorkers,
      pendingWorkers,
      totalRequests,
      activeBookings,
      completedBookings,
      totalRevenue: totalRevenueAgg._sum.amount ?? 0,
      totalPlatformFee: totalPlatformFeeAgg._sum.platformFee ?? 0,
      currency: env.defaultCurrency,
    };
  },
};