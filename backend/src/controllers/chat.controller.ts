import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { ok } from '../utils/api';

export const chatController = {
  async listConversations(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await chatService.listForUser(req.user!.sub))); } catch (error) { next(error); }
  },
  async getConversation(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await chatService.getConversation(req.params.id, req.user!.sub))); } catch (error) { next(error); }
  },
  async listMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
      res.json(ok(await chatService.listMessages(req.params.id, req.user!.sub, page, pageSize)));
    } catch (error) { next(error); }
  },
  async markRead(req: Request, res: Response, next: NextFunction) {
    try { res.json(ok(await chatService.markRead(req.params.id, req.user!.sub))); } catch (error) { next(error); }
  },
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await chatService.send({ senderId: req.user!.sub, ...req.body });
      res.status(201).json(ok(data));
    } catch (error) { next(error); }
  },
};
