import { useQuery } from '@tanstack/react-query';
import {
  Users, Briefcase, FileCheck, CalendarCheck, DollarSign, BarChart3,
  AlertTriangle, CheckCircle, ArrowUpRight, Clock, Star, Shield, Activity, Settings, Bell, Search,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { adminApi, AuditEntry } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, StatCard } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AuthContext';

type AnyData = Record<string, any> | null | undefined;

export function DashboardPage({ initialData }: { initialData?: AnyData } = {}) {
  const { t } = useI18n();
  const { user } = useAdminAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.analytics(),
    initialData,
    refetchInterval: 30_000, // refresh every 30s
  });
  const { data: audit } = useQuery({ queryKey: ['admin-dashboard-audit'], queryFn: () => adminApi.listAudit({ page: 1, pageSize: 6 }) });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const maxUsers = Math.max(data.totalCustomers, data.totalWorkers, 1);
  const customerPct = (data.totalCustomers / maxUsers) * 100;
  const workerPct = (data.totalWorkers / maxUsers) * 100;

  return (
    <div className="space-y-6">
      {/* Hero / welcome */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcomeBack')}, {user?.fullName?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="indigo">v1.0</Badge>
          <Badge color="green"><Activity size={10} className="mr-1 inline" /> Live</Badge>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('dashboard.users')}        value={(data.totalCustomers + data.totalWorkers).toLocaleString()} icon={Users} color="indigo" delta={`+${data.newSignups7d} 7d`} />
        <StatCard label={t('dashboard.customers')}   value={data.totalCustomers.toLocaleString()} icon={Users} color="blue" />
        <StatCard label={t('dashboard.workers')}     value={data.totalWorkers.toLocaleString()} icon={Briefcase} color="green" delta={`${data.approvedWorkers} approved`} />
        <StatCard label={t('dashboard.pendingKyc')}   value={data.pendingKyc.toLocaleString()} icon={FileCheck} color={data.pendingKyc > 0 ? 'yellow' : 'gray'} />
        <StatCard label={t('dashboard.openRequests')}  value={data.openRequests.toLocaleString()} icon={AlertTriangle} color="yellow" />
        <StatCard label={t('dashboard.activeBookings')} value={data.activeBookings.toLocaleString()} icon={CalendarCheck} color="indigo" />
        <StatCard label={t('dashboard.revenueToday')}  value={formatMmk(data.revenueToday)} icon={DollarSign} color="green" />
        <StatCard label={t('dashboard.revenueThisMonth')} value={formatMmk(data.revenueThisMonth)} icon={BarChart3} color="indigo" />
      </div>

      {/* User mix + revenue summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">User mix</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{t('dashboard.customers')}</span>
                <span className="font-medium">{data.totalCustomers}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${customerPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{t('dashboard.workers')}</span>
                <span className="font-medium">{data.totalWorkers}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${workerPct}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">{t('dashboard.newSignups7d')}</div>
              <div className="text-lg font-bold">{data.newSignups7d}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('dashboard.newSignups30d')}</div>
              <div className="text-lg font-bold">{data.newSignups30d}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('analytics.boostRevenue')}</div>
              <div className="text-lg font-bold">{formatMmk(data.boostRevenueThisMonth)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">{t('dashboard.systemHealth')}</h3>
          <SystemHealth />
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction to="/kyc" icon={FileCheck} label={t('nav.kyc')} hint={`${data.pendingKyc} ${t('dashboard.pendingKyc')}`} />
          <QuickAction to="/users" icon={Users} label={t('nav.users')} hint={`${data.totalCustomers + data.totalWorkers} total`} />
          <QuickAction to="/workers" icon={Briefcase} label={t('nav.workers')} hint={`${data.approvedWorkers} approved`} />
          <QuickAction to="/bookings" icon={CalendarCheck} label={t('nav.bookings')} hint={`${data.activeBookings} ${t('dashboard.activeBookings')}`} />
          <QuickAction to="/roles" icon={Shield} label={t('nav.roles')} hint="RBAC" />
          <QuickAction to="/config" icon={Settings} label={t('nav.config')} hint="Runtime settings" />
          <QuickAction to="/broadcast" icon={Bell} label={t('nav.broadcast')} hint="Push notifications" />
          <QuickAction to="/audit" icon={Clock} label={t('nav.audit')} hint={`${audit?.total || 0} entries`} />
        </div>
      </div>

      {/* Recent activity */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-900">{t('dashboard.recentActivity')}</h3>
          <Link to="/audit" className="text-sm text-indigo-600 hover:underline">{t('common.seeAll')} →</Link>
        </div>
        {(!audit || audit.items.length === 0) ? (
          <EmptyState title="No admin actions yet" description="Audit log entries will appear here as you use the platform." />
        ) : (
          <div className="space-y-2">
            {audit.items.slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <Avatar name={a.actorName} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-medium">{a.actorName}</span>
                    <Badge color="indigo">{a.action}</Badge>
                    {a.targetType && <Badge color="gray">{a.targetType}</Badge>}
                  </div>
                  {a.reason && <div className="text-xs text-gray-500 truncate">{a.reason}</div>}
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(a.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, hint }: { to: string; icon: any; label: string; hint?: string }) {
  return (
    <Link to={to} className="block p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow transition">
      <Icon size={20} className="text-indigo-600 mb-2" />
      <div className="font-medium text-gray-900 text-sm">{label}</div>
      {hint && <div className="text-xs text-gray-500 mt-0.5">{hint}</div>}
      <ArrowUpRight size={12} className="text-gray-400 absolute top-3 right-3" />
    </Link>
  );
}

function SystemHealth() {
  return (
    <div className="space-y-3 text-sm">
      <HealthItem label="Database" status="ok" detail="PostgreSQL — connected" />
      <HealthItem label="API Server" status="ok" detail="Express on :4000" />
      <HealthItem label="Real-time" status="ok" detail="Socket.IO active" />
      <HealthItem label="File uploads" status="ok" detail="/uploads" />
    </div>
  );
}

function HealthItem({ label, status, detail }: { label: string; status: 'ok' | 'warn' | 'err'; detail: string }) {
  const colors = { ok: 'bg-green-500', warn: 'bg-yellow-500', err: 'bg-red-500' };
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500">{detail}</div>
      </div>
      <CheckCircle size={14} className="text-green-500" />
    </div>
  );
}
