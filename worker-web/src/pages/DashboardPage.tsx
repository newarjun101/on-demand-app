import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Inbox, Briefcase, DollarSign, Star, ArrowRight, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi, earningsApi, requestApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Spinner, StarRating } from '@/components/UI';
import { formatDate, formatMmk, timeAgo } from '@/utils/format';
import { BOOKING_STATUS_LABELS } from '@/utils/statuses';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const { data: jobsData, isLoading: jobsLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => bookingApi.listJobs(1, 50) });
  const { data: requestsData, isLoading: requestsLoading } = useQuery({ queryKey: ['request-feed'], queryFn: () => requestApi.feed(1, 5) });
  const { data: earnings, isLoading: earningsLoading } = useQuery({ queryKey: ['earnings'], queryFn: earningsApi.summary });

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
          <h2 className="mt-4 text-xl font-bold text-gray-900">Profile under review</h2>
          <p className="text-sm text-gray-500 mt-2">We're checking your profile. You'll get jobs as soon as you're approved.</p>
        </Card>
      </div>
    );
  }
  if (profile && profile.verificationStatus === 'REJECTED') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Profile rejected</h2>
          <p className="text-sm text-gray-500 mt-2">{profile.verificationStatus}</p>
          <Link to="/onboarding" className="inline-block mt-4"><Button>Update profile</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi {user.fullName.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Here's your day at a glance</p>
        </div>
        {profile && (
          <div className="flex items-center gap-2 text-sm">
            <Badge color={profile.isOnline && profile.isAcceptingJobs ? 'green' : profile.isOnline ? 'yellow' : 'gray'}>
              {profile.isOnline && profile.isAcceptingJobs ? 'Accepting jobs' : profile.isOnline ? 'Online · paused' : 'Offline'}
            </Badge>
            {profile.emergencyAvailable && <Badge color="red">24/7</Badge>}
            <Badge color="green"><Star size={10} className="mr-0.5 inline" /> {profile.ratingAverage.toFixed(1)}</Badge>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Today's jobs" value={todaysJobs.length} icon={CalendarDays} loading={jobsLoading} />
        <StatCard title="Pending requests" value={requestsData?.total ?? 0} icon={Inbox} loading={requestsLoading} />
        <StatCard title="Active jobs" value={pending.length} icon={Briefcase} loading={jobsLoading} />
        <StatCard
          title="Today's earnings"
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
              <h2 className="font-semibold">Recent requests</h2>
              <Link to="/requests" className="text-sm text-brand-700 inline-flex items-center hover:underline">See all <ArrowRight size={14} className="ml-1" /></Link>
            </div>
            {requestsLoading ? (
              <div className="p-4 space-y-2">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (requestsData?.items.length ?? 0) === 0 ? (
              <EmptyState title="No matching requests yet" description="Make sure you're online and accepting jobs." />
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
                          <span>Budget: {r.minBudget || r.maxBudget ? `${formatMmk(r.minBudget)} – ${formatMmk(r.maxBudget)}` : '—'}</span>
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
              <h2 className="font-semibold">Upcoming jobs</h2>
              <Link to="/jobs" className="text-sm text-brand-700 inline-flex items-center hover:underline">See all <ArrowRight size={14} className="ml-1" /></Link>
            </div>
            {jobsLoading ? (
              <div className="p-4 space-y-2">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (todaysJobs.length === 0 && pending.length === 0) ? (
              <EmptyState title="No upcoming jobs" description="New bookings will appear here." />
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
            <h2 className="font-semibold mb-3">Earnings</h2>
            {earningsLoading ? <Skeleton className="h-24" /> : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Today</span><span className="font-semibold">{formatMmk(earnings?.today ?? 0)}</span></div>
                <div className="flex justify-between"><span>This week</span><span className="font-semibold">{formatMmk(earnings?.thisWeek ?? 0)}</span></div>
                <div className="flex justify-between"><span>This month</span><span className="font-semibold">{formatMmk(earnings?.thisMonth ?? 0)}</span></div>
                <div className="flex justify-between pt-2 border-t"><span>All time</span><span className="font-semibold text-brand-700">{formatMmk(earnings?.allTime ?? 0)}</span></div>
                <Link to="/earnings" className="text-xs text-brand-700 inline-flex items-center hover:underline mt-2">View details <ArrowRight size={12} className="ml-1" /></Link>
              </div>
            )}
          </Card>

          {/* Profile score */}
          {profile && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Your stats</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Rating</span>
                  <span className="flex items-center gap-1"><StarRating value={profile.ratingAverage} /> <span className="font-semibold">{profile.ratingAverage.toFixed(1)}</span></span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Reviews</span><span className="font-semibold">{profile.ratingCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Completed</span><span className="font-semibold">{profile.completedJobs}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-semibold">{profile.experienceYears} years</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Radius</span><span className="font-semibold">{profile.serviceRadiusKm} km</span></div>
              </div>
              <Link to="/profile" className="text-xs text-brand-700 inline-flex items-center hover:underline mt-3">Edit profile <ArrowRight size={12} className="ml-1" /></Link>
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
      <div className="flex items-center justify-between">
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