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
import { boostRouter } from './routes/boost.routes';
import { eventRouter } from './routes/event.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { errorHandler, notFoundHandler, apiVersionRouter } from './middleware/i18n';
import { detectOrigin } from './middleware/auth';
import { generalRateLimiter } from './middleware/rateLimit';
import { docsRouter } from './swagger';

// All routers are mounted under BOTH the versioned /api/v1/:locale prefix
// (recommended) AND the legacy /api prefix (kept for backwards compatibility).
// The apiVersionRouter strips the /v1/:locale prefix before the request
// reaches the actual router so router code is unchanged.
const versionedApiRouter = express.Router();
const legacyApiRouter = express.Router();

function register(router: express.Router) {
  router.use('/auth', authRouter);
  router.use('/users', userRouter);
  router.use('/workers', workerRouter);
  router.use('/categories', categoryRouter);
  router.use('/services', serviceRouter);
  router.use('/requests', requestRouter);
  router.use(quoteRouter); // /requests/:id/quotes, /quotes/:id/...
  router.use('/bookings', bookingRouter);
  router.use(reviewRouter);
  router.use('/conversations', conversationRouter);
  router.use('/messages', messageRouter);
  router.use('/notifications', notificationRouter);
  router.use('/favorites', favoriteRouter);
  router.use('/disputes', disputeRouter);
  router.use('/admin', adminRouter);
  router.use('/files', fileRouter);
  router.use(boostRouter);
  router.use('/events', eventRouter);
  router.use(analyticsRouter);
}

register(versionedApiRouter);
register(legacyApiRouter);

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

  // Strip /api/v1/:locale prefix + pick up the locale
  app.use(apiVersionRouter);

  // General rate limit
  app.use('/api', generalRateLimiter);

  // Static uploads
  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  // Health
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', env: env.nodeEnv, time: new Date().toISOString() } });
  });

  // Swagger / OpenAPI docs
  //   GET /api/docs(.json)                 legacy
  //   GET /api/v1/:locale/docs(.json)       versioned + localized
  app.use('/api', docsRouter());

  // Routes
  app.use('/api/v1/:locale', versionedApiRouter);
  app.use('/api', legacyApiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}