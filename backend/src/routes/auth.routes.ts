import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { authController } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), authController.register);

authRouter.post('/login', authRateLimiter, validate(loginSchema), authController.login);

authRouter.post('/refresh', authRateLimiter, validate(refreshSchema), authController.refresh);

authRouter.post('/logout', authenticate(), authController.logout);

authRouter.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

authRouter.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);