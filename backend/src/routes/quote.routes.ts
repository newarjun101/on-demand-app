import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuoteSchema } from '../validators/quote';
import { quoteController } from '../controllers/quote.controller';

export const quoteRouter = Router();

quoteRouter.post('/requests/:requestId/quotes', authenticate(), requireRole('WORKER'), validate(createQuoteSchema), quoteController.create);

quoteRouter.get('/requests/:requestId/quotes', authenticate(), requireRole('CUSTOMER'), quoteController.listForRequest);

quoteRouter.post('/quotes/:id/withdraw', authenticate(), requireRole('WORKER'), quoteController.withdraw);

quoteRouter.post('/quotes/:id/accept', authenticate(), requireRole('CUSTOMER'), quoteController.accept);

quoteRouter.post('/quotes/:id/reject', authenticate(), requireRole('CUSTOMER'), quoteController.reject);