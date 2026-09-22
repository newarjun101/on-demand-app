import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ok } from '../utils/api';

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 14 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const appOrigin = req.appOrigin ?? (req.body?.role === 'WORKER' ? 'WORKER_WEB' : 'CUSTOMER_WEB');
      const registrationOrigin = appOrigin === 'WORKER_WEB' ? 'WORKER_WEB' : 'CUSTOMER_WEB';
      const result = await authService.register(req.body, registrationOrigin);
      res.cookie('refresh_token', result.refreshToken, refreshCookieOptions);
      res.json(ok({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.cookie('refresh_token', result.refreshToken, refreshCookieOptions);
      res.json(ok({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.cookie('refresh_token', result.refreshToken, refreshCookieOptions);
      res.json(ok({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }));
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.sub);
      res.clearCookie('refresh_token', { path: '/api/auth' });
      res.json(ok({}));
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.identifier);
      res.json(ok({}));
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.identifier, req.body.token, req.body.newPassword);
      res.json(ok({}));
    } catch (error) {
      next(error);
    }
  },
};
