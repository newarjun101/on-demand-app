// Business logic for the admin portal. All operations are gated by
// `requirePermission()` in the router — this service assumes the caller
// is allowed and focuses on correctness, audit logging, and concurrency.

import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { errors } from '../utils/api';
import { hashPassword } from '../utils/password';

async function hash(p: string) {
  return hashPassword(p);
}

export const adminService = {
  // -------- permissions lookup (used by the route guard) --------
  async permissionsForUser(userId: string): Promise<string[]> {
    const ur = await prisma.userRole.findMany({ where: { userId }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
    const set = new Set<string>();
    for (const r of ur) {
      for (const rp of r.role.permissions) set.add(rp.permission.key);
    }
    return Array.from(set);
  },

  // -------- me (current admin) --------
  async meWithRolesAndPermissions(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw errors.notFound('User not found');
    const roles = await prisma.userRole.findMany({
      where: { userId }, include: { role: true },
    });
    const perms = await this.permissionsForUser(userId);
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: roles.map((r) => ({ id: r.role.id, slug: r.role.slug, name: r.role.name })),
      permissions: perms,
    };
  },

  // -------- analytics (KPIs) --------
  async analytics() {
    const now = new Date();
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalCustomers, totalWorkers, approvedWorkers, pendingKyc,
      openRequests, activeBookings, completedToday,
      revenueTodayAgg, revenueMonthAgg, feesMonthAgg,
      signups7d, signups30d, boostRevenueAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      prisma.user.count({ where: { role: 'WORKER', deletedAt: null } }),
      prisma.workerProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.kycDocument.count({ where: { status: 'PENDING' } }),
      prisma.serviceRequest.count({ where: { status: 'FINDING_WORKERS', deletedAt: null } }),
      prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'] } } }),
      prisma.booking.count({ where: { status: 'COMPLETED', completedAt: { gte: todayStart } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: todayStart } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
      prisma.booking.aggregate({ _sum: { platformFee: true }, where: { status: 'COMPLETED', completedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
      prisma.user.count({ where: { createdAt: { gte: since7d } } }),
      prisma.user.count({ where: { createdAt: { gte: since30d } } }),
      prisma.boost.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: since30d } } }),
    ]);

    return {
      totalCustomers, totalWorkers, approvedWorkers, pendingKyc,
      openRequests, activeBookings, completedToday,
      revenueToday: revenueTodayAgg._sum.amount ?? 0,
      revenueThisMonth: revenueMonthAgg._sum.amount ?? 0,
      platformFeesThisMonth: feesMonthAgg._sum.platformFee ?? 0,
      newSignups7d: signups7d, newSignups30d: signups30d,
      boostRevenueThisMonth: boostRevenueAgg._sum.amount ?? 0,
    };
  },

  // -------- users --------
  async listUsers(p: { page: number; pageSize: number; role?: string; status?: string; q?: string }) {
    const where: any = { deletedAt: null };
    if (p.role && p.role !== 'all') where.role = p.role;
    if (p.status === 'active') where.isActive = true;
    if (p.status === 'banned') where.isBanned = true;
    if (p.status === 'inactive') where.isActive = false;
    if (p.q) {
      where.OR = [
        { fullName: { contains: p.q, mode: 'insensitive' } },
        { email:    { contains: p.q, mode: 'insensitive' } },
        { phone:    { contains: p.q } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where, include: { workerProfile: { include: { services: { include: { service: true } } } }, roles: { include: { role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (p.page - 1) * p.pageSize, take: p.pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    const permsCache = new Map<string, string[]>();
    const enriched = await Promise.all(items.map(async (u) => {
      let perms = permsCache.get(u.id);
      if (!perms) { perms = await this.permissionsForUser(u.id); permsCache.set(u.id, perms); }
      return {
        id: u.id, email: u.email, phone: u.phone, fullName: u.fullName, avatarUrl: u.avatarUrl,
        role: u.role, isActive: u.isActive, isBanned: u.isBanned, bannedReason: u.bannedReason,
        emailVerified: u.emailVerified, phoneVerified: u.phoneVerified,
        ratingAverage: u.workerProfile?.ratingAverage ?? 0,
        ratingCount: u.workerProfile?.ratingCount ?? 0,
        completedJobs: u.workerProfile?.completedJobs ?? 0,
        createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
        workerProfile: u.workerProfile ? {
          id: u.workerProfile.id,
          city: u.workerProfile.city,
          verificationStatus: u.workerProfile.verificationStatus,
          rejectionReason: u.workerProfile?.rejectionReason,
          isBoosted: u.workerProfile.isBoosted,
          boostExpiresAt: u.workerProfile.boostExpiresAt,
          emergencyAvailable: u.workerProfile.emergencyAvailable,
        } : null,
        roles: u.roles.map((r) => ({ id: r.role.id, slug: r.role.slug, name: r.role.name })),
        permissions: perms,
      };
    }));
    return { items: enriched, total, page: p.page, pageSize: p.pageSize };
  },

  async getUserFull(userId: string) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: { include: { services: { include: { service: true } }, availability: true } }, roles: { include: { role: true } } },
    });
    if (!u) throw errors.notFound('User not found');
    const perms = await this.permissionsForUser(userId);
    return {
      ...u,
      passwordHash: undefined, refreshTokenHash: undefined,
      roles: u.roles.map((r) => ({ id: r.role.id, slug: r.role.slug, name: r.role.name })),
      permissions: perms,
    };
  },

  async banUser(actorId: string, userId: string, reason: string) {
    if (userId === actorId) throw errors.badRequest('You cannot ban yourself');
    const before = await prisma.user.findUnique({ where: { id: userId } });
    const updated = await prisma.user.update({ where: { id: userId }, data: { isBanned: true, bannedReason: reason, isActive: false } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'user.ban', targetType: 'User', targetId: userId, reason, before: before as any, after: updated as any } });
    return updated;
  },

  async unbanUser(actorId: string, userId: string) {
    const before = await prisma.user.findUnique({ where: { id: userId } });
    const updated = await prisma.user.update({ where: { id: userId }, data: { isBanned: false, bannedReason: null, isActive: true } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'user.unban', targetType: 'User', targetId: userId, before: before as any, after: updated as any } });
    return updated;
  },

  async deleteUser(actorId: string, userId: string) {
    if (userId === actorId) throw errors.badRequest('You cannot delete yourself');
    const before = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), isActive: false } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'user.delete', targetType: 'User', targetId: userId, before: before as any, after: Prisma.JsonNull, metadata: { deleted: true } } });
    return { ok: true };
  },

  async impersonate(actorId: string, userId: string) {
    if (userId === actorId) throw errors.badRequest('You cannot impersonate yourself');
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw errors.notFound('User not found');
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'user.impersonate', targetType: 'User', targetId: userId } });
    return { ok: true, target: { id: u.id, email: u.email } };
  },

  // -------- workers --------
  async listWorkers(p: { page: number; pageSize: number; status?: string; q?: string }) {
    const where: any = {};
    if (p.status && p.status !== 'all') where.verificationStatus = p.status;
    if (p.q) {
      where.OR = [
        { user: { fullName: { contains: p.q, mode: 'insensitive' } } },
        { user: { email:    { contains: p.q, mode: 'insensitive' } } },
        { city: { contains: p.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.workerProfile.findMany({
        where, include: { user: { select: { id: true, email: true, phone: true, fullName: true, avatarUrl: true } }, services: { include: { service: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (p.page - 1) * p.pageSize, take: p.pageSize,
      }),
      prisma.workerProfile.count({ where }),
    ]);
    return { items, total, page: p.page, pageSize: p.pageSize };
  },

  async approveWorker(actorId: string, workerProfileId: string) {
    const before = await prisma.workerProfile.findUnique({ where: { id: workerProfileId } });
    if (!before) throw errors.notFound('Worker not found');
    const updated = await prisma.workerProfile.update({
      where: { id: workerProfileId },
      data: { verificationStatus: 'APPROVED', rejectionReason: null, verifiedAt: new Date() },
    });
    await prisma.kycDocument.updateMany({
      where: { workerProfileId, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedBy: actorId, reviewedAt: new Date() },
    });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'worker.approve', targetType: 'WorkerProfile', targetId: workerProfileId, before: before as any, after: updated as any } });
    return updated;
  },

  async rejectWorker(actorId: string, workerProfileId: string, reason: string) {
    const before = await prisma.workerProfile.findUnique({ where: { id: workerProfileId } });
    if (!before) throw errors.notFound('Worker not found');
    const updated = await prisma.workerProfile.update({
      where: { id: workerProfileId },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason },
    });
    await prisma.kycDocument.updateMany({
      where: { workerProfileId, status: 'PENDING' },
      data: { status: 'REJECTED', reviewedBy: actorId, reviewedAt: new Date(), rejectionReason: reason },
    });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'worker.reject', targetType: 'WorkerProfile', targetId: workerProfileId, reason, before: before as any, after: updated as any } });
    return updated;
  },

  async suspendWorker(actorId: string, workerProfileId: string, reason: string) {
    const before = await prisma.workerProfile.findUnique({ where: { id: workerProfileId } });
    if (!before) throw errors.notFound('Worker not found');
    const updated = await prisma.workerProfile.update({
      where: { id: workerProfileId },
      data: { verificationStatus: 'SUSPENDED' },
    });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'worker.suspend', targetType: 'WorkerProfile', targetId: workerProfileId, reason, before: before as any, after: updated as any } });
    return updated;
  },

  async workerDocuments(workerProfileId: string) {
    const docs = await prisma.kycDocument.findMany({ where: { workerProfileId }, orderBy: { createdAt: 'desc' } });
    const profile = await prisma.workerProfile.findUnique({
      where: { id: workerProfileId },
      include: { user: { select: { fullName: true, email: true } } },
    });
    return docs.map((d) => ({ ...d, workerName: profile?.user.fullName, workerEmail: profile?.user.email }));
  },

  // -------- KYC --------
  async listKyc(p: { page: number; pageSize: number; status?: string }) {
    const where: any = {};
    if (p.status && p.status !== 'all') where.status = p.status;
    const [items, total] = await Promise.all([
      prisma.kycDocument.findMany({
        where,
        include: { workerProfile: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (p.page - 1) * p.pageSize, take: p.pageSize,
      }),
      prisma.kycDocument.count({ where }),
    ]);
    return { items, total, page: p.page, pageSize: p.pageSize };
  },

  async reviewKyc(actorId: string, docId: string, body: { action: 'APPROVE' | 'REJECT' | 'NEEDS_MORE_INFO'; reason?: string; adminNotes?: string }) {
    const doc = await prisma.kycDocument.findUnique({ where: { id: docId } });
    if (!doc) throw errors.notFound('KYC document not found');
    let newStatus: any;
    if (body.action === 'APPROVE') newStatus = 'APPROVED';
    else if (body.action === 'REJECT') newStatus = 'REJECTED';
    else newStatus = 'NEEDS_MORE_INFO';
    const updated = await prisma.kycDocument.update({
      where: { id: docId },
      data: {
        status: newStatus,
        reviewedBy: actorId,
        reviewedAt: new Date(),
        rejectionReason: body.action === 'REJECT' ? body.reason : null,
        adminNotes: body.adminNotes,
      },
    });
    // If APPROVE, and all required docs for this worker are approved, promote them
    if (body.action === 'APPROVE') {
      const documents = await prisma.kycDocument.findMany({ where: { workerProfileId: doc.workerProfileId, blocksApproval: true } });
      const approvedTypes = new Set(documents.filter((item) => item.status === 'APPROVED').map((item) => item.type));
      const hasSelfie = approvedTypes.has('SELFIE');
      const hasNrc = approvedTypes.has('NATIONAL_ID_FRONT') && approvedTypes.has('NATIONAL_ID_BACK');
      const hasPassport = approvedTypes.has('PASSPORT');
      const hasRequiredIdentitySet = hasSelfie && (hasNrc || hasPassport);
      const pending = documents.some((item) => item.status === 'PENDING');
      if (!pending && hasRequiredIdentitySet) {
        await prisma.workerProfile.update({
          where: { id: doc.workerProfileId },
          data: { verificationStatus: 'APPROVED', rejectionReason: null, verifiedAt: new Date() },
        });
      }
    }
    if (body.action === 'REJECT') {
      await prisma.workerProfile.update({
        where: { id: doc.workerProfileId },
        data: { verificationStatus: 'REJECTED', rejectionReason: body.reason },
      });
    }
    await prisma.adminAuditLog.create({
      data: { actorId, actorName: '(admin)', action: `kyc.${body.action.toLowerCase()}`, targetType: 'KycDocument', targetId: docId, reason: body.reason },
    });
    return updated;
  },

  // -------- bookings --------
  async listBookings(p: { page: number; pageSize: number; status?: string }) {
    const where: any = {};
    if (p.status && p.status !== 'all') where.status = p.status;
    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { customer: { select: { fullName: true } }, worker: { select: { fullName: true } }, request: { include: { service: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (p.page - 1) * p.pageSize, take: p.pageSize,
      }),
      prisma.booking.count({ where }),
    ]);
    return {
      items: items.map((b) => ({
        id: b.id, status: b.status,
        customerId: b.customerId, customerName: b.customer.fullName,
        workerId: b.workerId, workerName: b.worker.fullName,
        serviceName: b.request.service.name,
        total: b.total, commissionPercent: b.commissionPercent,
        platformFee: b.platformFee, workerEarnings: b.workerEarnings,
        scheduledAt: b.scheduledAt, completedAt: b.completedAt, createdAt: b.createdAt,
      })),
      total, page: p.page, pageSize: p.pageSize,
    };
  },

  async refundBooking(actorId: string, bookingId: string, amount: number, reason: string) {
    const b = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
    if (!b) throw errors.notFound('Booking not found');
    const before = { ...b };
    if (b.payment) {
      await prisma.payment.update({ where: { id: b.payment.id }, data: { status: 'REFUNDED' } });
    }
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'booking.refund', targetType: 'Booking', targetId: bookingId, reason, before: before as any, after: Prisma.JsonNull, metadata: { amount } } });
    return { ok: true, amount };
  },

  // -------- categories --------
  async listCategories() {
    const cats = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { services: true } } },
    });
    return cats.map((c) => ({
      id: c.id, name: c.name, slug: c.slug, description: c.description, icon: c.icon, sortOrder: c.sortOrder, isActive: c.isActive, serviceCount: c._count.services,
    }));
  },

  async createCategory(actorId: string, body: { name: string; slug: string; icon?: string; description?: string; sortOrder?: number }) {
    const c = await prisma.serviceCategory.create({ data: body });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'category.create', targetType: 'Category', targetId: c.id, after: c as any } });
    return c;
  },

  async updateCategory(actorId: string, id: string, body: any) {
    const before = await prisma.serviceCategory.findUnique({ where: { id } });
    const c = await prisma.serviceCategory.update({ where: { id }, data: body });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'category.update', targetType: 'Category', targetId: id, before: before as any, after: c as any } });
    return c;
  },

  async deleteCategory(actorId: string, id: string) {
    const before = await prisma.serviceCategory.findUnique({ where: { id } });
    await prisma.serviceCategory.update({ where: { id }, data: { isActive: false } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'category.delete', targetType: 'Category', targetId: id, before: before as any } });
    return { ok: true };
  },

  // -------- roles --------
  async listRoles() {
    const roles = await prisma.adminRole.findMany({
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'asc' }],
    });
    return roles.map((r) => ({
      id: r.id, slug: r.slug, name: r.name, description: r.description, isBuiltIn: r.isBuiltIn,
      permissions: r.permissions.map((p) => p.permission.key),
      userCount: r._count.users,
      createdAt: r.createdAt,
    }));
  },

  async listPermissions() {
    return prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  },

  async createRole(actorId: string, body: { slug: string; name: string; description?: string; permissions: string[] }) {
    const perms = await prisma.permission.findMany({ where: { key: { in: body.permissions } } });
    if (perms.length !== body.permissions.length) {
      throw errors.badRequest('One or more permissions do not exist');
    }
    const r = await prisma.adminRole.create({
      data: {
        slug: body.slug, name: body.name, description: body.description,
        permissions: { create: perms.map((p) => ({ permissionId: p.id })) },
      },
    });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'role.create', targetType: 'Role', targetId: r.id, after: r as any } });
    return r;
  },

  async updateRole(actorId: string, id: string, body: { name?: string; description?: string; permissions?: string[] }) {
    const before = await prisma.adminRole.findUnique({ where: { id } });
    if (before?.isBuiltIn) throw errors.forbidden('Built-in roles cannot be edited');
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    const r = await prisma.adminRole.update({ where: { id }, data });
    if (body.permissions) {
      const perms = await prisma.permission.findMany({ where: { key: { in: body.permissions } } });
      if (perms.length !== body.permissions.length) throw errors.badRequest('One or more permissions do not exist');
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId: id, permissionId: p.id })) });
    }
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'role.update', targetType: 'Role', targetId: id, before: before as any, after: r as any } });
    return r;
  },

  async deleteRole(actorId: string, id: string) {
    const before = await prisma.adminRole.findUnique({ where: { id } });
    if (before?.isBuiltIn) throw errors.forbidden('Built-in roles cannot be deleted');
    await prisma.adminRole.delete({ where: { id } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'role.delete', targetType: 'Role', targetId: id, before: before as any } });
    return { ok: true };
  },

  async assignRoles(actorId: string, userId: string, roleIds: string[]) {
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId, assignedBy: actorId })) }),
    ]);
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'roles.assign', targetType: 'User', targetId: userId, metadata: { roleIds } } });
    return { ok: true };
  },

  // -------- config --------
  async getConfig() {
    return prisma.platformConfig.upsert({ where: { id: 'singleton' }, update: {}, create: { id: 'singleton' } });
  },

  async updateConfig(actorId: string, body: any) {
    const before = await this.getConfig();
    const c = await prisma.platformConfig.update({ where: { id: 'singleton' }, data: { ...body, updatedBy: actorId } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'config.update', targetType: 'Config', targetId: 'singleton', before: before as any, after: c as any } });
    return c;
  },

  // -------- audit --------
  async listAudit(p: { page: number; pageSize: number; actorId?: string; action?: string }) {
    const where: any = {};
    if (p.actorId) where.actorId = p.actorId;
    if (p.action) where.action = { contains: p.action };
    const [items, total] = await Promise.all([
      prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p.page - 1) * p.pageSize, take: p.pageSize }),
      prisma.adminAuditLog.count({ where }),
    ]);
    return { items, total, page: p.page, pageSize: p.pageSize };
  },

  // -------- broadcast --------
  async broadcast(actorId: string, body: { segment: 'all' | 'customers' | 'workers' | 'admins'; title: string; body: string }) {
    const where: any = { deletedAt: null };
    if (body.segment === 'customers') where.role = 'CUSTOMER';
    if (body.segment === 'workers') where.role = 'WORKER';
    if (body.segment === 'admins') where.role = 'ADMIN';
    const users = await prisma.user.findMany({ where, select: { id: true } });
    await prisma.notification.createMany({ data: users.map((u) => ({ userId: u.id, type: 'SYSTEM', title: body.title, body: body.body })) });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'notifications.broadcast', targetType: 'System', targetId: 'broadcast', metadata: { segment: body.segment, count: users.length } } });
    return { sent: users.length };
  },

  // -------- boost tiers / pricing --------
  async getPricing() {
    const config = await prisma.platformConfig.findFirst();
    const boostTiers = [
      { id: 'tier_3d', days: 3, price: 5000, factor: 2, label: '3 days' },
      { id: 'tier_7d', days: 7, price: 9000, factor: 2.5, label: '7 days' },
      { id: 'tier_14d', days: 14, price: 15000, factor: 3, label: '14 days' },
      { id: 'tier_30d', days: 30, price: 25000, factor: 4, label: '30 days' },
    ];
    return { commissionPercent: config?.commissionPercent ?? 10, defaultCurrency: config?.defaultCurrency ?? 'MMK', boostTiers };
  },
  async updatePricing(id: string, body: any) {
    if (id === 'config') {
      const data = await prisma.platformConfig.upsert({
        where: { id: 'singleton' },
        update: { commissionPercent: body.commissionPercent, defaultCurrency: body.defaultCurrency },
        create: { commissionPercent: body.commissionPercent ?? 10, defaultCurrency: body.defaultCurrency ?? 'MMK' },
      });
      return data;
    }
    return { updated: true, id, ...body };
  },

  // -------- payments --------
  async listPayments(p: { page: number; pageSize: number; status?: string }) {
    const where: any = {};
    if (p.status && p.status !== 'all') where.status = p.status;
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { payer: { select: { id: true, fullName: true } }, receiver: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (p.page - 1) * p.pageSize,
        take: p.pageSize,
      }),
      prisma.payment.count({ where }),
    ]);
    return { items, total, page: p.page, pageSize: p.pageSize };
  },

  // -------- reviews (admin) --------
  async listReviews(p: { page: number; pageSize: number; minRating?: number }) {
    const where: any = {};
    if (p.minRating) where.rating = { gte: p.minRating };
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          subject: { select: { id: true, fullName: true, avatarUrl: true } },
          booking: { select: { id: true, request: { select: { service: { select: { name: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p.page - 1) * p.pageSize,
        take: p.pageSize,
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total, page: p.page, pageSize: p.pageSize };
  },
  async deleteReview(actorId: string, reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw errors.notFound('Review not found');
    await prisma.review.delete({ where: { id: reviewId } });
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'reviews.delete', targetType: 'Review', targetId: reviewId } });
    return { deleted: true };
  },

  // -------- disputes (admin) --------
  async listDisputes(p: { page: number; pageSize: number; status?: string }) {
    const where: any = {};
    if (p.status && p.status !== 'all') where.status = p.status;
    const [items, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          opener: { select: { id: true, fullName: true, avatarUrl: true } },
          booking: {
            select: {
              id: true, status: true, total: true, request: { select: { service: { select: { name: true } } } },
              customer: { select: { id: true, fullName: true } },
              worker: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p.page - 1) * p.pageSize,
        take: p.pageSize,
      }),
      prisma.dispute.count({ where }),
    ]);
    return { items, total, page: p.page, pageSize: p.pageSize };
  },
  async resolveDispute(actorId: string, disputeId: string, body: { resolution: string; refundAmount?: number }) {
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw errors.notFound('Dispute not found');
    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'RESOLVED', resolution: body.resolution, resolvedAt: new Date() },
    });
    if (body.refundAmount && body.refundAmount > 0) {
      await prisma.booking.update({ where: { id: dispute.bookingId }, data: { status: 'CANCELLED' } });
    }
    await prisma.adminAuditLog.create({ data: { actorId, actorName: '(admin)', action: 'disputes.resolve', targetType: 'Dispute', targetId: disputeId, metadata: { resolution: body.resolution, refundAmount: body.refundAmount } } });
    return updated;
  },
};
