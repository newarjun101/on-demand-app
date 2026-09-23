import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bookingApi } from '@/api/endpoints';
import { Badge, Card, EmptyState, Skeleton } from '@/components/UI';
import { Pagination } from '@/components/Pagination';
import { BOOKING_STATUS_LABELS } from '@/utils/statuses';
import { formatDate, formatMmk } from '@/utils/format';
import { Avatar } from '@/components/UI';
import { Wrench, MapPin, CalendarDays } from 'lucide-react';

const PAGE_SIZE = 20;

export function BookingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', page],
    queryFn: () => bookingApi.listMine(page, PAGE_SIZE),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My bookings</h1>
      <p className="text-sm text-gray-500 mt-1">Track all your service bookings</p>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Create your first request to get matched with a worker."
            action={<Link to="/" className="text-brand-700 font-medium hover:underline">Find a worker</Link>}
          />
        ) : (
          data!.items.map((b) => (
            <Link to={`/bookings/${b.id}`} key={b.id} className="block">
              <Card className="p-4 hover:border-brand-300 transition">
                <div className="flex items-start gap-3">
                  <Avatar src={b.worker?.avatarUrl ?? null} name={b.worker?.fullName ?? 'Worker'} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{b.worker?.fullName}</div>
                        <div className="text-sm text-gray-500">{b.request?.service.name}</div>
                      </div>
                      <Badge color={b.status === 'COMPLETED' ? 'green' : 'primary'}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatDate(b.scheduledAt ?? b.startedAt ?? b.createdAt)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={12} />{b.request?.city}</span>
                      <span className="inline-flex items-center gap-1"><Wrench size={12} />{formatMmk(b.total)}</span>
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
