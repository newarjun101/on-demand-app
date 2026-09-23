import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRequestSchema, listRequestsQuerySchema } from '../validators/request';
import { requestController } from '../controllers/request.controller';

export const requestRouter = Router();

// Customer creates request
requestRouter.post('/', authenticate(), requireRole('CUSTOMER'), validate(createRequestSchema), requestController.create);

requestRouter.get('/mine', authenticate(), requireRole('CUSTOMER'), validate(listRequestsQuerySchema, 'query'), requestController.listMine);

requestRouter.get('/feed', authenticate(), requireRole('WORKER'), validate(listRequestsQuerySchema, 'query'), requestController.listFeed);

requestRouter.get('/:id', authenticate(), requestController.getById);

requestRouter.post('/:id/cancel', authenticate(), requireRole('CUSTOMER'), requestController.cancel);