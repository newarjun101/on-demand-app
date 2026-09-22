import { useI18n } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints';
import { Card, Skeleton, StatCard } from '@/components/UI';
import { formatMmk } from '@/utils/format';
import { Users, Briefcase, CalendarCheck, DollarSign } from 'lucide-react';

export function AnalyticsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ['admin-analytics-page'], queryFn: () => adminApi.analytics() });
  if (isLoading || !data) return <Skeleton className="h-64" />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('analytics.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('analytics.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('dashboard.users')} value={data.totalCustomers + data.totalWorkers} icon={Users} color="indigo" />
        <StatCard label={t('dashboard.approvedWorkers')} value={data.approvedWorkers} icon={Briefcase} color="green" />
        <StatCard label={t('dashboard.activeBookings')} value={data.activeBookings} icon={CalendarCheck} color="blue" />
        <StatCard label={t('analytics.revenue')} value={formatMmk(data.revenueThisMonth)} icon={DollarSign} color="green" />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide">{t('analytics.signups')}</div>
          <div className="text-2xl font-bold mt-1">{data.newSignups30d}</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide">{t('analytics.fees')}</div>
          <div className="text-2xl font-bold mt-1">{formatMmk(data.platformFeesThisMonth)}</div>
          <div className="text-xs text-gray-500 mt-1">This month</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide">{t('analytics.boostRevenue')}</div>
          <div className="text-2xl font-bold mt-1">{formatMmk(data.boostRevenueThisMonth)}</div>
          <div className="text-xs text-gray-500 mt-1">This month</div>
        </Card>
      </div>
    </div>
  );
}
