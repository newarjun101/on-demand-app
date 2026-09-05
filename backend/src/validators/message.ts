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

export const markReadSchema = z.object({
  conversationId: z.string().uuid(),
});