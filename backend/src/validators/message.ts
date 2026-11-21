import { z } from 'zod';

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  recipientId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  text: z.string().max(2000).optional(),
  imageUrl: z.string().optional(),
}).refine(
  (d) => Boolean(d.text) || Boolean(d.imageUrl),
  { message: 'Message must include text or image' },
);

export const openConversationSchema = z.object({
  recipientId: z.string().uuid(),
  requestId: z.string().uuid().optional(),
});

export const markReadSchema = z.object({
  conversationId: z.string().uuid(),
});

export const chatPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const conversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});