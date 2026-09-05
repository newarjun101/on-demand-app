import rateLimit from 'express-rate-limit';
import { errors } from '../utils/api';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(errors.tooMany('Too many auth attempts, please try again later')),
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(errors.tooMany('Too many requests')),
});