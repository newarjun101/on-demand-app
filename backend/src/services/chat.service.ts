import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { emitToUser, emitToUsers } from '../sockets/io';

export const chatService = {
  async ensureConversation(opts: {
    customerId: string;
    workerId: string;
    requestId?: string;
    bookingId?: string;
  }) {
    const { customerId, workerId, requestId, bookingId } = opts;
    const existing = await prisma.conversation.findFirst({
      where: {
        customerId,
        workerId,
        requestId: requestId ?? null,
        bookingId: bookingId ?? null,
      },
    });
    if (existing) return existing;
    return prisma.conversation.create({
      data: { customerId, workerId, requestId, bookingId },
    });
  },

  // Finds or creates the customer/worker conversation between the caller and
  // the recipient without sending a message.
  async open(opts: { userId: string; recipientId: string; requestId?: string }) {
    const recipient = await prisma.user.findUnique({ where: { id: opts.recipientId } });
    if (!recipient) throw errors.notFound('Recipient not found');
    const sender = await prisma.user.findUnique({ where: { id: opts.userId } });
    if (!sender) throw errors.unauthorized();
    if (sender.role === recipient.role) {
      throw errors.badRequest('Cannot chat with same role users');
    }
    const customerId = sender.role === 'CUSTOMER' ? sender.id : recipient.id;
    const workerId = sender.role === 'WORKER' ? sender.id : recipient.id;
    return this.ensureConversation({ customerId, workerId, requestId: opts.requestId });
  },

  async listForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { OR: [{ customerId: userId }, { workerId: userId }] },
      include: {
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        worker: { select: { id: true, fullName: true, avatarUrl: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });
  },

  async getConversation(id: string, userId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        worker: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    if (!conv) throw errors.notFound('Conversation not found');
    if (conv.customerId !== userId && conv.workerId !== userId) {
      throw errors.forbidden();
    }
    return conv;
  },

  async listMessages(conversationId: string, userId: string, page: number, pageSize: number) {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw errors.notFound('Conversation not found');
    if (conv.customerId !== userId && conv.workerId !== userId) throw errors.forbidden();

    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);
    return { items: items.reverse(), total, page, pageSize };
  },

  async send(opts: {
    senderId: string;
    recipientId?: string;
    conversationId?: string;
    requestId?: string;
    text?: string;
    imageUrl?: string;
  }) {
    let conversationId = opts.conversationId;

    if (!conversationId) {
      if (!opts.recipientId) throw errors.badRequest('Recipient is required');
      const conv = await this.open({ userId: opts.senderId, recipientId: opts.recipientId, requestId: opts.requestId });
      conversationId = conv.id;
    }

    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw errors.notFound('Conversation not found');
    if (conv.customerId !== opts.senderId && conv.workerId !== opts.senderId) {
      throw errors.forbidden();
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: opts.senderId,
        text: opts.text,
        imageUrl: opts.imageUrl,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const recipientId = conv.customerId === opts.senderId ? conv.workerId : conv.customerId;
    const isRecipientCustomer = recipientId === conv.customerId;

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        customerUnreadCount: isRecipientCustomer ? { increment: 1 } : undefined,
        workerUnreadCount: !isRecipientCustomer ? { increment: 1 } : undefined,
      },
    });

    emitToUsers([recipientId, opts.senderId], 'new_message', {
      conversationId,
      message,
    });

    return message;
  },

  async markRead(conversationId: string, userId: string) {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw errors.notFound('Conversation not found');
    if (conv.customerId !== userId && conv.workerId !== userId) throw errors.forbidden();

    const isCustomer = conv.customerId === userId;
    await prisma.$transaction([
      prisma.message.updateMany({
        where: { conversationId, NOT: { senderId: userId }, readAt: null },
        data: { readAt: new Date() },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: isCustomer ? { customerUnreadCount: 0 } : { workerUnreadCount: 0 },
      }),
    ]);

    const other = isCustomer ? conv.workerId : conv.customerId;
    emitToUser(other, 'message_read', { conversationId, by: userId });

    return { conversationId };
  },
};