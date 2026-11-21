import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Inbox, Briefcase, DollarSign, ArrowRight, MapPin, Star, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi, earningsApi, requestApi, boostApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Spinner, StarRating } from '@/components/UI';
import { formatDate, formatMmk, timeAgo } from '@/utils/format';
import { BOOKING_STATUS_LABELS } from '@/utils/statuses';
import { useI18n } from '@/i18n';

export function DashboardPage() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const { data: jobsData, isLoading: jobsLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => bookingApi.listJobs(1, 50) });
  const { data: requestsData, isLoading: requestsLoading } = useQuery({ queryKey: ['request-feed'], queryFn: () => requestApi.feed(1, 5) });
  const { data: earnings, isLoading: earningsLoading } = useQuery({ queryKey: ['earnings'], queryFn: earningsApi.summary });
  const { data: boosts } = useQuery({ queryKey: ['my-boosts'], queryFn: boostApi.myBoosts });

  const jobs = jobsData?.items ?? [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaysJobs = jobs.filter((j) => j.scheduledAt && new Date(j.scheduledAt) >= today && !['COMPLETED', 'CANCELLED'].includes(j.status));
  const pending = jobs.filter((j) => ['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(j.status));
  const completed = jobs.filter((j) => j.status === 'COMPLETED');

  if (!user) return null;
  if (profile && profile.verificationStatus === 'PENDING') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
            <Star size={20} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">{t('onboarding.reviewTitle')}</h2>
          <p className="text-sm text-gray-500 mt-2">{t('onboarding.reviewPendingHint')}</p>
        </Card>
      </div>
    );
  }
  if (profile && profile.verificationStatus === 'REJECTED') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">{t('onboarding.profileRejected')}</h2>
          <p className="text-sm text-gray-500 mt-2">{profile.verificationStatus}</p>
          <Link to="/onboarding" className="inline-block mt-4"><Button>{t('onboarding.updateProfile')}</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.greeting', { name: user.fullName.split(' ')[0] })} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        {profile && (
          <div className="flex items-center gap-2 text-sm">
            <Badge color={profile.isOnline && profile.isAcceptingJobs ? 'green' : profile.isOnline ? 'yellow' : 'gray'}>
              {profile.isOnline && profile.isAcceptingJobs ? t('status.acceptingJobs') : profile.isOnline ? `${t('status.online')} · ${t('common.pause')}` : t('status.offline')}
            </Badge>
            {profile.emergencyAvailable && <Badge color="red">24/7</Badge>}
            <Badge color="green"><Star size={10} className="mr-0.5 inline" /> {profile.ratingAverage.toFixed(1)}</Badge>
          </div>
        )}
      </div>

      {/* Boost status banner */}
      {boosts?.isBoosted ? (
        <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-500" fill="currentColor" />
            <div>
              <div className="text-sm font-medium text-amber-900">{t('boost.boostedActive')}</div>
              <div className="text-xs text-amber-800">{t('boost.activeUntil', { date: boosts.boostExpiresAt ? new Date(boosts.boostExpiresAt).toLocaleDateString() : 'soon' })} · {t('boost.boostTraffic', { pct: '57' })}</div>
            </div>
          </div>
          <Link to="/boost">
            <Button size="sm" variant="outline">{t('boost.manage')}</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-500" fill="currentColor" />
            <div>
              <div className="text-sm font-medium text-amber-900">{t('boost.title')}</div>
              <div className="text-xs text-amber-800">{t('boost.subtitle')}</div>
            </div>
          </div>
          <Link to="/boost"><Button size="sm"><Zap size={14} className="mr-1" /> {t('boost.boostNow')}</Button></Link>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.todaysJobs')} value={todaysJobs.length} icon={CalendarDays} loading={jobsLoading} />
        <StatCard title={t('dashboard.pendingRequests')} value={requestsData?.total ?? 0} icon={Inbox} loading={requestsLoading} />
        <StatCard title={t('dashboard.activeJobs')} value={pending.length} icon={Briefcase} loading={jobsLoading} />
        <StatCard
          title={t('dashboard.todaysEarnings')}
          value={earningsLoading ? '—' : formatMmk(earnings?.today ?? 0)}
          icon={DollarSign}
          loading={earningsLoading}
        />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent requests */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">{t('dashboard.recentRequests')}</h2>
              <Link to="/requests" className="text-sm text-brand-700 inline-flex items-center hover:underline">{t('dashboard.viewAll')} <ArrowRight size={14} className="ml-1" /></Link>
            </div>
            {requestsLoading ? (
              <div className="p-4 space-y-2">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (requestsData?.items.length ?? 0) === 0 ? (
              <EmptyState title={t('dashboard.noRequests')} description={t('dashboard.noRequestsHint')} />
            ) : (
              <div className="divide-y">
                {requestsData!.items.slice(0, 5).map((r) => (
                  <Link key={r.id} to={`/requests/${r.id}`} className="block p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Avatar src={r.customer.avatarUrl} name={r.customer.fullName} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium truncate">{r.service.name}</div>
                          <div className="text-xs text-gray-500">{timeAgo(r.createdAt)}</div>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{r.description}</div>
                        <div className="text-xs text-gray-500 mt-1 inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1"><MapPin size={10} />{r.city}</span>
                          <span>·</span>
                          <span>{r.minBudget || r.maxBudget ? `${formatMmk(r.minBudget)} – ${formatMmk(r.maxBudget)}` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming jobs */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">{t('dashboard.upcomingJobs')}</h2>
              <Link to="/jobs" className="text-sm text-brand-700 inline-flex items-center hover:underline">{t('dashboard.viewAll')} <ArrowRight size={14} className="ml-1" /></Link>
            </div>
            {jobsLoading ? (
              <div className="p-4 space-y-2">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (todaysJobs.length === 0 && pending.length === 0) ? (
              <EmptyState title={t('dashboard.noUpcoming')} description={t('dashboard.noUpcomingHint')} />
            ) : (
              <div className="divide-y">
                {[...todaysJobs, ...pending].slice(0, 5).map((b) => (
                  <Link key={b.id} to={`/jobs/${b.id}`} className="block p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar src={b.customer?.avatarUrl ?? null} name={b.customer?.fullName ?? ''} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{b.request?.service.name}</div>
                        <div className="text-xs text-gray-500">{b.customer?.fullName} · {formatDate(b.scheduledAt)}</div>
                      </div>
                      <Badge color="primary">{BOOKING_STATUS_LABELS[b.status]}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Earnings summary */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">{t('dashboard.earnings')}</h2>
            {earningsLoading ? <Skeleton className="h-24" /> : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>{t('dashboard.today')}</span><span className="font-semibold">{formatMmk(earnings?.today ?? 0)}</span></div>
                <div className="flex justify-between"><span>{t('dashboard.thisWeek')}</span><span className="font-semibold">{formatMmk(earnings?.thisWeek ?? 0)}</span></div>
                <div className="flex justify-between"><span>{t('dashboard.thisMonth')}</span><span className="font-semibold">{formatMmk(earnings?.thisMonth ?? 0)}</span></div>
                <div className="flex justify-between pt-2 border-t"><span>{t('dashboard.allTime')}</span><span className="font-semibold text-brand-700">{formatMmk(earnings?.allTime ?? 0)}</span></div>
                <Link to="/earnings" className="text-xs text-brand-700 inline-flex items-center hover:underline mt-2">{t('common.view')} <ArrowRight size={12} className="ml-1" /></Link>
              </div>
            )}
          </Card>

          {/* Profile score */}
          {profile && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3">{t('dashboard.stats')}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-gray-500">{t('dashboard.rating')}</span>
                  <span className="flex items-center gap-1"><StarRating value={profile.ratingAverage} /> <span className="font-semibold">{profile.ratingAverage.toFixed(1)}</span></span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">{t('dashboard.reviews')}</span><span className="font-semibold">{profile.ratingCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('dashboard.completed')}</span><span className="font-semibold">{profile.completedJobs}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('dashboard.experience')}</span><span className="font-semibold">{profile.experienceYears}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('dashboard.radius')}</span><span className="font-semibold">{profile.serviceRadiusKm} km</span></div>
              </div>
              <Link to="/profile" className="text-xs text-brand-700 inline-flex items-center hover:underline mt-3">{t('dashboard.editProfile')} <ArrowRight size={12} className="ml-1" /></Link>
              <Link to="/analytics" className="text-xs text-brand-700 inline-flex items-center hover:underline mt-1">{t('dashboard.viewAnalytics')} <ArrowRight size={12} className="ml-1" /></Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string; value: any; icon: any; loading?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{loading ? <Spinner size={20} /> : value}</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}