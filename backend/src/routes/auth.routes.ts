import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth';
import { authenticate } from '../middleware/auth';
import { ok } from '../utils/api';
import { authRateLimiter } from '../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appOrigin = req.appOrigin ?? (req.body?.role === 'WORKER' ? 'WORKER_WEB' : 'CUSTOMER_WEB');
    const result = await authService.register(req.body, appOrigin as any);
    // Set refresh token as httpOnly cookie for SSR-less frontends
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    res.json(ok({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
  } catch (e) { next(e); }
});

authRouter.post('/login', authRateLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    res.json(ok({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
  } catch (e) { next(e); }
});

authRouter.post('/refresh', authRateLimiter, validate(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    res.json(ok({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
  } catch (e) { next(e); }
});

authRouter.post('/logout', authenticate(), async (req, res, next) => {
  try {
    await authService.logout(req.user!.sub);
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json(ok({}));
  } catch (e) { next(e); }
});

authRouter.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.identifier);
    res.json(ok({}));
  } catch (e) { next(e); }
});

authRouter.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.identifier, req.body.token, req.body.newPassword);
    res.json(ok({}));
  } catch (e) { next(e); }
});