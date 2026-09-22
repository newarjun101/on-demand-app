import { prisma } from '../config/prisma';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { errors, AppError } from '../utils/api';
import { Role } from '@prisma/client';
import { RegisterInput, LoginInput } from '../validators/auth';

export interface AuthResult {
  user: {
    id: string;
    role: Role;
    fullName: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    roles?: { id: string; slug: string; name: string }[];
    permissions?: string[];
  };
  accessToken: string;
  refreshToken: string;
}

function slugifyRole(role: Role): 'CUSTOMER_WEB' | 'WORKER_WEB' | 'ADMIN_WEB' {
  if (role === 'WORKER') return 'WORKER_WEB';
  if (role === 'ADMIN') return 'ADMIN_WEB';
  return 'CUSTOMER_WEB';
}

async function buildAuthResult(user: any): Promise<AuthResult> {
  const app = slugifyRole(user.role);
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    app,
  });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), refreshTokenHash: await hashPassword(refreshToken) },
  });
  // For admins, include the list of roles and the union of their permissions
  // so the admin-web can do client-side permission gating.
  let roles: { id: string; slug: string; name: string }[] | undefined;
  let permissions: string[] | undefined;
  if (user.role === 'ADMIN') {
    const urs = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    roles = urs.map((ur) => ({ id: ur.role.id, slug: ur.role.slug, name: ur.role.name }));
    permissions = Array.from(new Set(urs.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))));
  }
  return {
    user: {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roles,
      permissions,
    },
    accessToken,
    refreshToken,
  };
}

export const authService = {
  async register(input: RegisterInput, appOrigin?: 'CUSTOMER_WEB' | 'WORKER_WEB'): Promise<AuthResult> {
    const pwdError = validatePassword(input.password);
    if (pwdError) throw errors.validation(pwdError);

    if (input.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw errors.conflict('Email already in use');
    }
    if (input.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
      if (existing) throw errors.conflict('Phone already in use');
    }

    const passwordHash = await hashPassword(input.password);

    // We must not trust role from the client — but for registration it is fine
    // because we still create appropriate entities below.
    const user = await prisma.user.create({
      data: {
        role: input.role,
        email: input.email ?? null,
        phone: input.phone ?? null,
        passwordHash,
        fullName: input.fullName,
        avatarUrl: input.avatarUrl ?? null,
        workerProfile:
          input.role === 'WORKER'
            ? {
                create: {
                  city: input.city,
                  addressLine: input.addressLine,
                  experienceYears: input.experienceYears ?? 0,
                },
              }
            : undefined,
      },
      include: { workerProfile: true },
    });

    // Enforce app origin based on role
    const expectedApp = slugifyRole(input.role);
    if (appOrigin && appOrigin !== expectedApp) {
      // delete the user if wrong app
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
      throw errors.forbidden(`This endpoint is not allowed for ${appOrigin}`);
    }

    return buildAuthResult(user);
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findFirst({
      where: input.identifier.includes('@')
        ? { email: input.identifier.toLowerCase() }
        : { phone: input.identifier },
    });
    if (!user || !user.isActive) throw errors.invalidCredentials('Invalid email or password');
    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw errors.invalidCredentials('Invalid email or password');
    return buildAuthResult(user);
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw errors.unauthorized('Invalid refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) throw errors.unauthorized('Refresh token revoked');
    const matches = await verifyPassword(user.refreshTokenHash, refreshToken);
    if (!matches) throw errors.unauthorized('Refresh token mismatch');

    return buildAuthResult(user);
  },

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  },

  async forgotPassword(identifier: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: identifier.includes('@')
        ? { email: identifier.toLowerCase() }
        : { phone: identifier },
    });
    // Always respond ok to avoid enumeration; in production wire email/SMS.
    if (!user) return;
    // For MVP we log a token to console. In production, send via email/SMS.
    // eslint-disable-next-line no-console
    console.log(`[forgot-password] token for ${identifier}: reset-${user.id}`);
  },

  async resetPassword(identifier: string, token: string, newPassword: string): Promise<void> {
    const pwdError = validatePassword(newPassword);
    if (pwdError) throw errors.validation(pwdError);
    if (!token.startsWith('reset-')) throw errors.badRequest('Invalid or expired token');
    const userId = token.slice('reset-'.length);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw errors.badRequest('Invalid or expired token');
    const matches = identifier.includes('@')
      ? user.email === identifier.toLowerCase()
      : user.phone === identifier;
    if (!matches) throw errors.badRequest('Invalid or expired token');
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },
};

export type AuthService = typeof authService;