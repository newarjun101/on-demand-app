import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart3, Calendar, Eye, Heart, Briefcase, MessageCircle, TrendingUp, TrendingDown, Zap, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { analyticsApi, AnalyticsRange } from '@/api/endpoints';
import { Badge, Card, EmptyState, Skeleton, Spinner } from '@/components/UI';

const RANGES: { key: AnalyticsRange; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  boost: { label: 'Boosted placement', color: 'bg-amber-500' },
  search: { label: 'Search results', color: 'bg-blue-500' },
  home: { label: 'Home page', color: 'bg-emerald-500' },
  category: { label: 'Category page', color: 'bg-violet-500' },
  recommendations: { label: 'Recommended for you', color: 'bg-pink-500' },
  favorites: { label: 'Favorites page', color: 'bg-rose-500' },
  profile: { label: 'Worker profile', color: 'bg-cyan-500' },
  requests: { label: 'Job requests', color: 'bg-orange-500' },
  direct: { label: 'Direct link', color: 'bg-slate-500' },
  organic: { label: 'Other', color: 'bg-gray-400' },
};

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('week');
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', range],
    queryFn: () => analyticsApi.get(range),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track views, favorites, bookings and chats from customers</p>
          </div>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md transition',
                range === r.key ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      ) : !data ? (
        <EmptyState title="No analytics yet" description="Once customers view your profile, you'll see stats here." />
      ) : (
        <>
          {/* Boost status */}
          {data.isBoosted && data.boostExpiresAt && (
            <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-500" fill="currentColor" />
                <div>
                  <div className="text-sm font-medium text-amber-900">Boosted profile</div>
                  <div className="text-xs text-amber-800">Active until {new Date(data.boostExpiresAt).toLocaleDateString()} · {data.kpis.boostSharePct}% of recent traffic came from your boost</div>
                </div>
              </div>
              <Link to="/boost" className="text-sm text-amber-900 font-medium inline-flex items-center gap-1 hover:underline">
                Manage <ArrowUpRight size={14} />
              </Link>
            </div>
          )}

          {/* KPI cards */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Profile views"
              value={data.kpis.views}
              delta={data.kpis.viewsDelta}
              icon={Eye}
              loading={false}
            />
            <KpiCard
              title="Favorites"
              value={data.kpis.favorites}
              delta={data.kpis.favoritesDelta}
              icon={Heart}
              loading={false}
            />
            <KpiCard
              title="Bookings"
              value={data.kpis.bookings}
              delta={data.kpis.bookingsDelta}
              icon={Briefcase}
              loading={false}
            />
            <KpiCard
              title="Chats"
              value={data.kpis.chats}
              delta={data.kpis.chatsDelta}
              icon={MessageCircle}
              loading={false}
            />
          </div>

          {/* Conversions */}
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="text-xs text-gray-500 uppercase tracking-wide">View → Favorite</div>
              <div className="mt-1 text-3xl font-bold text-gray-900">{data.kpis.viewToFavoritePct}%</div>
              <div className="text-xs text-gray-500 mt-1">Of profile viewers who saved you as a favorite</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs text-gray-500 uppercase tracking-wide">View → Booking</div>
              <div className="mt-1 text-3xl font-bold text-gray-900">{data.kpis.viewToBookingPct}%</div>
              <div className="text-xs text-gray-500 mt-1">Of profile viewers who created a booking</div>
            </Card>
          </div>

          {/* Daily chart (last 14 days) */}
          <Card className="p-5 mt-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} /> Last 14 days
            </h2>
            <DailyChart points={data.daily} />
          </Card>

          {/* Source breakdown */}
          <Card className="p-5 mt-4">
            <h2 className="font-semibold text-gray-900">Where your views come from</h2>
            {data.bySource.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No traffic in this period yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.bySource.map((s) => {
                  const meta = SOURCE_LABELS[s.source] ?? { label: s.source, color: 'bg-gray-400' };
                  const totalForSource = s.views + s.favorites + s.bookings + s.chats;
                  const max = Math.max(...data.bySource.map((x) => x.views + x.favorites + x.bookings + x.chats), 1);
                  const pct = (totalForSource / max) * 100;
                  return (
                    <div key={s.source}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={clsx('w-2.5 h-2.5 rounded-full', meta.color)} />
                          <span className="font-medium text-gray-900">{meta.label}</span>
                          <span className="text-xs text-gray-500">({s.source})</span>
                        </div>
                        <div className="text-gray-700 text-sm">
                          <span className="font-semibold">{totalForSource}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {s.views > 0 && <span>{s.views} views</span>}
                            {s.favorites > 0 && <span> · {s.favorites} favs</span>}
                            {s.bookings > 0 && <span> · {s.bookings} bookings</span>}
                            {s.chats > 0 && <span> · {s.chats} chats</span>}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={clsx('h-full', meta.color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Boost summary */}
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Boost traffic</div>
                  <div className="mt-1 text-3xl font-bold text-amber-600">{data.kpis.boostSharePct}%</div>
                  <div className="text-xs text-gray-500 mt-1">Of total views</div>
                </div>
                <Zap size={40} className="text-amber-500" fill="currentColor" />
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Organic traffic</div>
                  <div className="mt-1 text-3xl font-bold text-emerald-600">{data.kpis.organicSharePct}%</div>
                  <div className="text-xs text-gray-500 mt-1">From search, home, etc.</div>
                </div>
                <TrendingUp size={40} className="text-emerald-500" />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, delta, icon: Icon }: { title: string; value: number; delta: number; icon: any; loading: boolean }) {
  const positive = delta > 0;
  const negative = delta < 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</div>
          {delta !== 0 && (
            <div className={clsx('text-xs mt-0.5 flex items-center gap-0.5', positive ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-gray-500')}>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(delta)}% vs prev period</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}

function DailyChart({ points }: { points: { date: string; views: number; favorites: number; bookings: number; chats: number }[] }) {
  const max = Math.max(1, ...points.map((p) => Math.max(p.views, p.favorites, p.bookings, p.chats)));
  const w = 100 / points.length;
  return (
    <div className="mt-3">
      <div className="flex items-end gap-1 h-40">
        {points.map((p) => {
          const vh = (p.views / max) * 100;
          const fh = (p.favorites / max) * 100;
          const bh = (p.bookings / max) * 100;
          const ch = (p.chats / max) * 100;
          return (
            <div key={p.date} className="flex-1 flex flex-col items-stretch gap-0.5 justify-end" title={`${p.date}: ${p.views} views, ${p.favorites} favs, ${p.bookings} bookings, ${p.chats} chats`}>
              <div className="bg-cyan-500 rounded-t" style={{ height: `${ch}%`, minHeight: p.chats > 0 ? '3px' : 0 }} />
              <div className="bg-emerald-500" style={{ height: `${bh}%`, minHeight: p.bookings > 0 ? '3px' : 0 }} />
              <div className="bg-rose-500" style={{ height: `${fh}%`, minHeight: p.favorites > 0 ? '3px' : 0 }} />
              <div className="bg-brand-500 rounded-b" style={{ height: `${vh}%`, minHeight: p.views > 0 ? '3px' : 0 }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-600 flex-wrap">
        <Legend color="bg-brand-500" label="Views" />
        <Legend color="bg-rose-500" label="Favorites" />
        <Legend color="bg-emerald-500" label="Bookings" />
        <Legend color="bg-cyan-500" label="Chats" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={clsx('w-2.5 h-2.5 rounded', color)} />
      <span>{label}</span>
    </div>
  );
}