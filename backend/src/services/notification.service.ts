import { prisma } from '../config/prisma';
import { NotificationType } from '@prisma/client';
import { emitToUser } from '../sockets/io';

export const notificationService = {
  async create(opts: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: any;
  }) {
    const notif = await prisma.notification.create({
      data: {
        userId: opts.userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        data: opts.data,
      },
    });
    emitToUser(opts.userId, 'notification_created', notif);
    return notif;
  },

  async listForUser(userId: string, page: number, pageSize: number, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) where.readAt = null;
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, total, unread, page, pageSize };
  },

  async markRead(userId: string, id: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) throw new Error('not found');
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },
};