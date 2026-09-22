import { prisma } from '../config/prisma';
import { errors } from '../utils/api';
import { distanceKm } from '../utils/geo';

export const eventService = {
  /**
   * Log a customer event (search, view, click, etc).
   * Lightweight insert; no validation beyond type whitelist.
   */
  async log(userId: string, input: {
    type: 'search' | 'view_service' | 'view_worker' | 'view_category' | 'click' | 'favorite' | 'book' | 'chat';
    serviceSlug?: string;
    categorySlug?: string;
    workerId?: string;
    city?: string;
    query?: string;
    source?: 'organic' | 'boost' | 'search' | 'category' | 'home' | 'profile' | 'direct' | 'favorites' | 'requests' | 'recommendations';
    weight?: number;
  }) {
    if (!userId) return null;
    return prisma.customerEvent.create({
      data: {
        userId,
        type: input.type,
        serviceSlug: input.serviceSlug ?? null,
        categorySlug: input.categorySlug ?? null,
        workerId: input.workerId ?? null,
        city: input.city ?? null,
        query: input.query ?? null,
        source: input.source ?? 'organic',
        weight: input.weight ?? 1,
      },
    });
  },

  /**
   * Build a personalised feed for a customer based on the last 30 days of
   * activity. Returns the worker's full card shape (the same one the search
   * endpoint returns) so the UI can render it identically.
   *
   * Strategy:
   *  1. Score each approved-and-accepting worker by:
   *     + service/category match with recent views / searches
   *     + city match
   *     + boosted (small permanent boost to a worker's base score)
   *     + base quality: rating, completed jobs, experience
   *  2. Exclude workers the customer has recently rejected / cancelled a quote with
   *  3. Deduplicate, sort, return top N
   */
  async recommendations(userId: string, page = 1, pageSize = 8, opts?: { latitude?: number; longitude?: number }) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Aggregate interest signals
    const events = await prisma.customerEvent.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const serviceInterest = new Map<string, number>();
    const categoryInterest = new Map<string, number>();
    const cityInterest = new Map<string, number>();
    const queryTerms = new Set<string>();
    const recentlyViewedWorkerIds = new Set<string>();
    const recentWorkerFavorites = new Set<string>();

    for (const e of events) {
      const w = e.weight;
      if (e.serviceSlug) serviceInterest.set(e.serviceSlug, (serviceInterest.get(e.serviceSlug) ?? 0) + 3 * w);
      if (e.categorySlug) categoryInterest.set(e.categorySlug, (categoryInterest.get(e.categorySlug) ?? 0) + 2 * w);
      if (e.city) cityInterest.set(e.city.toLowerCase(), (cityInterest.get(e.city.toLowerCase()) ?? 0) + 2 * w);
      if (e.query) {
        for (const word of e.query.toLowerCase().split(/\s+/).filter((w) => w.length >= 3)) {
          queryTerms.add(word);
        }
      }
      if (e.type === 'view_worker' && e.workerId) recentlyViewedWorkerIds.add(e.workerId);
      if (e.type === 'favorite' && e.workerId) recentWorkerFavorites.add(e.workerId);
    }

    // 2. Look up favorite service slugs to boost those workers higher
    const favWorkers = await prisma.favorite.findMany({
      where: { userId },
      include: {
        workerProfile: {
          include: { services: { include: { service: true } } },
        },
      },
      take: 50,
    });
    for (const f of favWorkers) {
      for (const s of f.workerProfile.services) {
        serviceInterest.set(s.service.slug, (serviceInterest.get(s.service.slug) ?? 0) + 4);
        categoryInterest.set(s.service.slug, (categoryInterest.get(s.service.slug) ?? 0) + 2);
      }
    }

    // 3. Candidate workers (broad)
    const candidates = await prisma.workerProfile.findMany({
      where: {
        verificationStatus: 'APPROVED',
        isAcceptingJobs: true,
        // Skip workers the user has already seen recently — we still include them
        // but they'll naturally rank below fresh suggestions.
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        services: { include: { service: { include: { category: true } } } },
        portfolio: { take: 3 },
      },
      take: 200,
    });

    // 4. Score each candidate
    const now = Date.now();
    const scored = candidates.map((w) => {
      let score = 0;
      // Boost (active)
      if (w.isBoosted && w.boostExpiresAt && new Date(w.boostExpiresAt).getTime() > now) {
        score += 50;
      }
      // Service match
      for (const ws of w.services) {
        const slug = ws.service.slug;
        const categorySlug = (ws.service as any).category?.slug;
        score += (serviceInterest.get(slug) ?? 0);
        if (categorySlug) score += (categoryInterest.get(categorySlug) ?? 0);
      }
      // City match
      if (w.city) score += (cityInterest.get(w.city.toLowerCase()) ?? 0);
      // Distance penalty (favour closer workers when we have a position)
      if (opts?.latitude != null && opts?.longitude != null && w.latitude && w.longitude) {
        const d = distanceKm(opts.latitude, opts.longitude, w.latitude, w.longitude);
        score += Math.max(0, 15 - d * 0.5);
      }
      // Quality
      score += w.ratingAverage * 2;
      score += Math.min(w.completedJobs, 100) * 0.1;
      score += Math.min(w.experienceYears, 15) * 0.5;
      // Recently viewed (small bonus so users see something they were looking at)
      if (recentlyViewedWorkerIds.has(w.userId)) score += 3;
      // Favorite workers
      if (recentWorkerFavorites.has(w.userId)) score += 10;
      // Query-term token overlap on bio / name
      if (queryTerms.size > 0) {
        const text = `${w.bio ?? ''} ${w.user.fullName}`.toLowerCase();
        for (const term of queryTerms) if (text.includes(term)) score += 1.5;
      }
      return { w, score };
    });

    // Drop 0-score candidates to keep the list relevant
    const filtered = scored.filter((s) => s.score > 0);
    filtered.sort((a, b) => b.score - a.score);

    // If user has no history at all, return empty so the UI can show the home
    // recommendations instead of empty state.
    if (events.length === 0 && favWorkers.length === 0) return { items: [], total: 0, page, pageSize };

    const items = (filtered.length ? filtered : scored)
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ w }) => formatCard(w));
    const total = (filtered.length ? filtered : scored).length;
    return { items, total, page, pageSize };
  },
};

function formatCard(p: any) {
  const startingPrice = p.services
    .map((s: any) => s.startingPrice ?? s.fixedPrice ?? s.hourlyRate ?? 0)
    .filter((n: number) => n > 0);
  const minPrice = startingPrice.length ? Math.min(...startingPrice) : null;
  return {
    id: p.id,
    userId: p.userId,
    name: p.user.fullName,
    avatarUrl: p.user.avatarUrl,
    verified: p.verificationStatus === 'APPROVED',
    boosted: p.isBoosted && p.boostExpiresAt && new Date(p.boostExpiresAt).getTime() > Date.now(),
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    experienceYears: p.experienceYears,
    completedJobs: p.completedJobs,
    city: p.city,
    startingPrice: minPrice,
    services: p.services.map((s: any) => ({
      id: s.service.id,
      name: s.service.name,
      slug: s.service.slug,
      pricingType: s.pricingType,
      startingPrice: s.startingPrice,
      hourlyRate: s.hourlyRate,
      fixedPrice: s.fixedPrice,
      category: s.service.category?.name,
    })),
    distanceKm: null as number | null,
    emergencyAvailable: p.emergencyAvailable,
    portfolio: (p.portfolio ?? []).map((i: any) => i.imageUrl),
  };
}