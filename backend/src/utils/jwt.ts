import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: Role;
  email?: string | null;
  app?: 'CUSTOMER_WEB' | 'WORKER_WEB' | 'ADMIN_WEB';
}

export interface RefreshPayload {
  sub: string;
  role: Role;
  tokenVersion?: number;
}

export function signAccessToken(payload: JwtPayload): string {
  const opts: SignOptions = { expiresIn: env.jwt.accessTtl as any };
  return jwt.sign(payload, env.jwt.secret, opts);
}

export function signRefreshToken(payload: RefreshPayload): string {
  const opts: SignOptions = { expiresIn: env.jwt.refreshTtl as any };
  return jwt.sign(payload, env.jwt.refreshSecret, opts);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshPayload;
}