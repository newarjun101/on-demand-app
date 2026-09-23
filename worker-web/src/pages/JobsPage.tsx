import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bookingApi } from '@/api/endpoints';
import { Avatar, Badge, Card, EmptyState, Skeleton } from '@/components/UI';
import { Pagination } from '@/components/Pagination';
import { formatDate, formatMmk } from '@/utils/format';
import { BOOKING_STATUS_LABELS } from '@/utils/statuses';
import { Wrench, MapPin, CalendarDays } from 'lucide-react';

const PAGE_SIZE = 20;

export function JobsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['jobs', page],
    queryFn: () => bookingApi.listJobs(page, PAGE_SIZE),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My jobs</h1>
      <p className="text-sm text-gray-500 mt-1">All your bookings in one place</p>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState title="No jobs yet" description="Your bookings will appear here when customers accept your quotes." />
        ) : (
          data!.items.map((b) => (
            <Link to={`/jobs/${b.id}`} key={b.id} className="block">
              <Card className="p-4 hover:border-brand-300 transition">
                <div className="flex items-start gap-3">
                  <Avatar src={b.customer?.avatarUrl ?? null} name={b.customer?.fullName ?? ''} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{b.customer?.fullName}</div>
                        <div className="text-sm text-gray-500">{b.request?.service.name}</div>
                      </div>
                      <Badge color={b.status === 'COMPLETED' ? 'green' : b.status === 'CANCELLED' ? 'red' : 'primary'}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatDate(b.scheduledAt ?? b.createdAt)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={12} />{b.request?.city}</span>
                      <span className="inline-flex items-center gap-1"><Wrench size={12} />{formatMmk(b.workerEarnings)} your earnings</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
      {data && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
      )}
    </div>
  );
}
