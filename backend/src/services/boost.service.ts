import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { emitToUser } from '../sockets/io';

export const boostService = {
  async pricing() {
    const config = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });
    return { tiers: configuredTiers(config?.boostTiers) };
  },
  /**
   * Activate a boost for a worker.
   * For MVP, payment is mocked (CASH_ON_COMPLETION) and boost is free.
   * In production, integrate with KBZPay / Wave Money / Stripe and verify the
   * payment before flipping isBoosted on the profile.
   */
  async purchaseBoost(workerUserId: string, input: { durationDays: number; amount: number; paymentMethod?: string }) {
    const { tiers } = await this.pricing();
    const tier = tiers.find((item) => item.days === input.durationDays && item.amount === input.amount);
    if (!tier) throw errors.badRequest('Select one of the available boost tiers');
    const profile = await prisma.workerProfile.findUnique({ where: { userId: workerUserId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    if (profile.verificationStatus !== 'APPROVED') {
      throw errors.forbidden('Only approved workers can boost');
    }
    const now = new Date();
    const startsAt = profile.isBoosted && profile.boostExpiresAt && profile.boostExpiresAt > now
      ? profile.boostExpiresAt
      : now;
    const expiresAt = new Date(startsAt.getTime() + input.durationDays * 24 * 60 * 60 * 1000);
    const boost = await prisma.boost.create({
      data: {
        workerProfileId: profile.id,
        amount: input.amount,
        durationDays: input.durationDays,
        startsAt,
        expiresAt,
        paymentMethod: input.paymentMethod ?? 'CASH_ON_COMPLETION',
        status: 'ACTIVE',
      },
    });
    await prisma.workerProfile.update({
      where: { id: profile.id },
      data: { isBoosted: true, boostExpiresAt: expiresAt, hasUsedBoost: true },
    });
    emitToUser(workerUserId, 'boost:activated', { boostId: boost.id, expiresAt });
    return boost;
  },

  async myBoosts(workerUserId: string) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId: workerUserId } });
    if (!profile) throw errors.notFound('Worker profile not found');
    const boosts = await prisma.boost.findMany({
      where: { workerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return {
      boosts,
      isBoosted: profile.isBoosted && profile.boostExpiresAt != null && profile.boostExpiresAt > new Date(),
      boostExpiresAt: profile.boostExpiresAt,
    };
  },

  /**
   * Background sweep: if a boost has expired, flip isBoosted off.
   * Called opportunistically by other endpoints.
   */
  async expireBoosts() {
    const now = new Date();
    const expired = await prisma.boost.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      select: { id: true, workerProfileId: true },
    });
    if (!expired.length) return 0;
    const profileIds = [...new Set(expired.map((b) => b.workerProfileId))];
    await prisma.$transaction([
      prisma.boost.updateMany({ where: { id: { in: expired.map((b) => b.id) } }, data: { status: 'EXPIRED' } }),
      prisma.workerProfile.updateMany({
        where: { id: { in: profileIds }, boostExpiresAt: { lte: now } },
        data: { isBoosted: false, boostExpiresAt: null },
      }),
    ]);
    return expired.length;
  },

};

export type BoostTier = { id: string; days: number; amount: number; label: string; boostFactor: number };

export const DEFAULT_BOOST_TIERS: BoostTier[] = [
  { id: 'tier_3d', days: 3, amount: 5000, label: '3 days', boostFactor: 2 },
  { id: 'tier_7d', days: 7, amount: 9000, label: '7 days', boostFactor: 2.5 },
  { id: 'tier_14d', days: 14, amount: 15000, label: '14 days', boostFactor: 3 },
  { id: 'tier_30d', days: 30, amount: 25000, label: '30 days', boostFactor: 4 },
];

export function configuredTiers(value: unknown): BoostTier[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_BOOST_TIERS;
  return value as BoostTier[];
}
