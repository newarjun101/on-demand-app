import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { errors } from '../utils/api';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      appOrigin?: 'CUSTOMER_WEB' | 'WORKER_WEB' | 'ADMIN_WEB';
    }
  }
}

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  return header
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cur) => {
      const idx = cur.indexOf('=');
      if (idx > 0) acc[cur.slice(0, idx)] = decodeURIComponent(cur.slice(idx + 1));
      return acc;
    }, {});
}

export function authenticate(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
      if (!token) {
        const cookies = parseCookies(req.headers.cookie);
        token = cookies['access_token'];
      }
      if (!token) throw errors.unauthorized('Missing access token');
      const payload = verifyAccessToken(token);
      req.user = payload;
      req.appOrigin = payload.app;
      next();
    } catch (err) {
      if (err && (err as any).name === 'TokenExpiredError') {
        return next(errors.unauthorized('Token expired'));
      }
      next(errors.unauthorized('Invalid token'));
    }
  };
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(errors.unauthorized());
    if (!roles.includes(req.user.role)) return next(errors.forbidden('Role not allowed'));
    next();
  };
}

export function optionalAuth(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
      if (!token) {
        const cookies = parseCookies(req.headers.cookie);
        token = cookies['access_token'];
      }
      if (token) {
        const payload = verifyAccessToken(token);
        req.user = payload;
        req.appOrigin = payload.app;
      }
    } catch {
      // ignore - treat as unauthenticated
    }
    next();
  };
}

export function detectOrigin(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && origin.includes('5174')) req.appOrigin = 'WORKER_WEB';
    else if (origin && origin.includes('5173')) req.appOrigin = 'CUSTOMER_WEB';
    else if (origin && origin.includes('5176')) req.appOrigin = 'ADMIN_WEB';
    else if (req.headers['x-app-origin'] === 'WORKER_WEB') req.appOrigin = 'WORKER_WEB';
    else if (req.headers['x-app-origin'] === 'CUSTOMER_WEB') req.appOrigin = 'CUSTOMER_WEB';
    else if (req.headers['x-app-origin'] === 'ADMIN_WEB') req.appOrigin = 'ADMIN_WEB';
    next();
  };
}