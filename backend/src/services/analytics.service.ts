import { prisma } from '../config/prisma';
import { errors } from '../utils/api';

export type AnalyticsRange = 'day' | 'week' | 'month' | 'year' | 'all';

function startOf(range: AnalyticsRange): Date {
  const now = new Date();
  if (range === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay()); // Sunday
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (range === 'year') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return new Date(0);
}

interface DailyPoint {
  date: string; // YYYY-MM-DD
  views: number;
  favorites: number;
  bookings: number;
  chats: number;
}

interface SourceBreakdown {
  source: string;
  views: number;
  favorites: number;
  bookings: number;
  chats: number;
}

export const analyticsService = {
  /**
   * Aggregate customer activity for the given worker's profile over the
   * chosen time range. Returns high-level KPIs plus daily and source
   * breakdowns, so the UI can render simple charts without extra requests.
   */
  async forWorker(workerUserId: string, range: AnalyticsRange) {
    const profile = await prisma.workerProfile.findUnique({ where: { userId: workerUserId } });
    if (!profile) throw errors.notFound('Worker profile not found');

    const from = startOf(range);
    const now = new Date();

    // All events targeting this worker (we don't restrict range here because
    // we want a comparison with the previous equal-length period).
    const allForWorker = await prisma.customerEvent.findMany({
      where: { workerId: profile.id, type: { in: ['view_worker', 'favorite', 'book', 'chat'] } },
      orderBy: { createdAt: 'desc' },
    });

    const periodMs = now.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodMs);

    const inPeriod = allForWorker.filter((e) => e.createdAt >= from);
    const inPrev = allForWorker.filter((e) => e.createdAt >= prevFrom && e.createdAt < from);

    // Tally by type
    const count = (events: typeof allForWorker, type: string) => events.filter((e) => e.type === type).length;
    const tally = (events: typeof allForWorker) => ({
      views: count(events, 'view_worker'),
      favorites: count(events, 'favorite'),
      bookings: count(events, 'book'),
      chats: count(events, 'chat'),
    });
    const current = tally(inPeriod);
    const previous = tally(inPrev);

    // Daily breakdown (last 14 days, regardless of range, for sparklines)
    const dailyMap = new Map<string, DailyPoint>();
    const since14d = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    since14d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(since14d.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, views: 0, favorites: 0, bookings: 0, chats: 0 });
    }
    for (const e of allForWorker) {
      if (e.createdAt < since14d) continue;
      const key = e.createdAt.toISOString().slice(0, 10);
      const point = dailyMap.get(key);
      if (!point) continue;
      if (e.type === 'view_worker') point.views++;
      else if (e.type === 'favorite') point.favorites++;
      else if (e.type === 'book') point.bookings++;
      else if (e.type === 'chat') point.chats++;
    }
    const daily = Array.from(dailyMap.values());

    // Source breakdown for the chosen period
    const sourceMap = new Map<string, SourceBreakdown>();
    for (const e of inPeriod) {
      const key = e.source ?? 'organic';
      let row = sourceMap.get(key);
      if (!row) {
        row = { source: key, views: 0, favorites: 0, bookings: 0, chats: 0 };
        sourceMap.set(key, row);
      }
      if (e.type === 'view_worker') row.views++;
      else if (e.type === 'favorite') row.favorites++;
      else if (e.type === 'book') row.bookings++;
      else if (e.type === 'chat') row.chats++;
    }
    const bySource = Array.from(sourceMap.values()).sort((a, b) => b.views - a.views);

    // Conversion: views -> favorites, views -> bookings
    const viewToFavorite = current.views > 0 ? (current.favorites / current.views) * 100 : 0;
    const viewToBooking = current.views > 0 ? (current.bookings / current.views) * 100 : 0;

    // Boost status: is the worker currently boosted, and how much of the
    // recent traffic came from boost impressions?
    const boostViews = bySource.find((s) => s.source === 'boost')?.views ?? 0;
    const organicViews = (bySource.find((s) => s.source === 'organic')?.views ?? 0)
      + (bySource.find((s) => s.source === 'search')?.views ?? 0)
      + (bySource.find((s) => s.source === 'category')?.views ?? 0)
      + (bySource.find((s) => s.source === 'home')?.views ?? 0)
      + (bySource.find((s) => s.source === 'profile')?.views ?? 0)
      + (bySource.find((s) => s.source === 'direct')?.views ?? 0)
      + (bySource.find((s) => s.source === 'favorites')?.views ?? 0)
      + (bySource.find((s) => s.source === 'requests')?.views ?? 0)
      + (bySource.find((s) => s.source === 'recommendations')?.views ?? 0);
    const totalViews = current.views || 1;
    const boostShare = (boostViews / totalViews) * 100;
    const organicShare = (organicViews / totalViews) * 100;

    return {
      range,
      from: from.toISOString(),
      to: now.toISOString(),
      isBoosted: profile.isBoosted && profile.boostExpiresAt != null && profile.boostExpiresAt > now,
      boostExpiresAt: profile.boostExpiresAt,
      kpis: {
        views: current.views,
        viewsDelta: pctChange(current.views, previous.views),
        favorites: current.favorites,
        favoritesDelta: pctChange(current.favorites, previous.favorites),
        bookings: current.bookings,
        bookingsDelta: pctChange(current.bookings, previous.bookings),
        chats: current.chats,
        chatsDelta: pctChange(current.chats, previous.chats),
        viewToFavoritePct: round1(viewToFavorite),
        viewToBookingPct: round1(viewToBooking),
        boostSharePct: round1(boostShare),
        organicSharePct: round1(organicShare),
      },
      daily,
      bySource,
    };
  },
};

function pctChange(now: number, prev: number): number {
  if (prev === 0) return now > 0 ? 100 : 0;
  return round1(((now - prev) / prev) * 100);
}
function round1(n: number): number { return Math.round(n * 10) / 10; }