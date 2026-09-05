import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { workerRouter } from './routes/worker.routes';
import { categoryRouter, serviceRouter } from './routes/category.routes';
import { requestRouter } from './routes/request.routes';
import { quoteRouter } from './routes/quote.routes';
import { bookingRouter } from './routes/booking.routes';
import { reviewRouter } from './routes/review.routes';
import { conversationRouter, messageRouter } from './routes/chat.routes';
import { notificationRouter } from './routes/notification.routes';
import { favoriteRouter } from './routes/favorite.routes';
import { disputeRouter } from './routes/dispute.routes';
import { adminRouter } from './routes/admin.routes';
import { fileRouter } from './routes/file.routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import { detectOrigin } from './middleware/auth';
import { generalRateLimiter } from './middleware/rateLimit';

export function buildApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (env.corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Detect which app is calling
  app.use(detectOrigin());

  // General rate limit
  app.use('/api', generalRateLimiter);

  // Static uploads
  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  // Health
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', env: env.nodeEnv, time: new Date().toISOString() } });
  });

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/workers', workerRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/services', serviceRouter);
  app.use('/api/requests', requestRouter);
  app.use('/api', quoteRouter); // /api/requests/:id/quotes, /api/quotes/:id/...
  app.use('/api/bookings', bookingRouter);
  app.use('/api', reviewRouter);
  app.use('/api/conversations', conversationRouter);
  app.use('/api/messages', messageRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/favorites', favoriteRouter);
  app.use('/api/disputes', disputeRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/files', fileRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}