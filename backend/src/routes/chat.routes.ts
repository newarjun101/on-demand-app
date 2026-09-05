import { Router } from 'express';
import { chatService } from '../services/chat.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '../validators/message';
import { ok } from '../utils/api';

export const conversationRouter = Router();

conversationRouter.get('/', authenticate(), async (req, res, next) => {
  try {
    const data = await chatService.listForUser(req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});

conversationRouter.get('/:id', authenticate(), async (req, res, next) => {
  try {
    const data = await chatService.getConversation(req.params.id, req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});

conversationRouter.get('/:id/messages', authenticate(), async (req: any, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 50);
    const data = await chatService.listMessages(req.params.id, req.user!.sub, page, pageSize);
    res.json(ok(data));
  } catch (e) { next(e); }
});

conversationRouter.post('/:id/read', authenticate(), async (req, res, next) => {
  try {
    const data = await chatService.markRead(req.params.id, req.user!.sub);
    res.json(ok(data));
  } catch (e) { next(e); }
});

export const messageRouter = Router();

messageRouter.post('/', authenticate(), validate(sendMessageSchema), async (req, res, next) => {
  try {
    const data = await chatService.send({
      senderId: req.user!.sub,
      recipientId: req.body.recipientId,
      conversationId: req.body.conversationId,
      requestId: req.body.requestId,
      text: req.body.text,
      imageUrl: req.body.imageUrl,
    });
    res.status(201).json(ok(data));
  } catch (e) { next(e); }
});