import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { disputeController } from '../controllers/dispute.controller';

export const disputeRouter = Router();

disputeRouter.post('/bookings/:bookingId', authenticate(), disputeController.open);

disputeRouter.get('/mine', authenticate(), disputeController.listMine);