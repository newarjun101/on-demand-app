import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Award, Calendar } from 'lucide-react';
import { bookingApi, earningsApi } from '@/api/endpoints';
import { Badge, Card, EmptyState, Skeleton } from '@/components/UI';
import { formatDate, formatMmk } from '@/utils/format';
import { BOOKING_STATUS_LABELS } from '@/utils/statuses';
import clsx from 'clsx';

export function EarningsPage() {
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const { data: earnings, isLoading } = useQuery({ queryKey: ['earnings'], queryFn: earningsApi.summary });
  const { data: jobs } = useQuery({ queryKey: ['jobs'], queryFn: () => bookingApi.listJobs(1, 100) });

  const items = (jobs?.items ?? []).filter((j) => j.status === 'COMPLETED');
  const totals = earnings ?? { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0, currency: 'MMK' };
  const ranges = [
    { key: 'today', label: 'Today', value: totals.today },
    { key: 'week', label: 'This week', value: totals.thisWeek },
    { key: 'month', label: 'This month', value: totals.thisMonth },
    { key: 'all', label: 'All time', value: totals.allTime },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
      <p className="text-sm text-gray-500 mt-1">Track your income and job history</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {ranges.map((r) => (
          <Card
            key={r.key}
            onClick={() => setRange(r.key)}
            className={clsx('p-4 cursor-pointer', range === r.key && 'border-brand-500 ring-2 ring-brand-100')}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide">{r.label}</div>
            <div className="text-xl font-bold mt-1 text-gray-900">{isLoading ? <Skeleton className="h-6 w-24" /> : formatMmk(r.value)}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mt-6">
        <h2 className="font-semibold mb-3">Transactions</h2>
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : items.length === 0 ? (
          <EmptyState title="No completed jobs yet" description="Complete jobs to start earning." />
        ) : (
          <div className="divide-y">
            {items.map((b) => (
              <div key={b.id} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{b.request?.service.name} · {b.customer?.fullName}</div>
                  <div className="text-xs text-gray-500">{formatDate(b.completedAt)} · {BOOKING_STATUS_LABELS[b.status]}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-xs text-gray-500">Gross {formatMmk(b.subtotal)} · Fee {formatMmk(b.platformFee)}</div>
                  <div className="font-semibold text-brand-700">+{formatMmk(b.workerEarnings)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}