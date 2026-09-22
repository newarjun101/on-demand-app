import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationController } from '../controllers/notification.controller';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate(), notificationController.list);

notificationRouter.post('/:id/read', authenticate(), notificationController.markRead);

notificationRouter.post('/read-all', authenticate(), notificationController.markAllRead);