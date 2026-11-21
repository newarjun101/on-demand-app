import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox, Briefcase, DollarSign, MessageCircle } from 'lucide-react';
import { notificationApi } from '@/api/endpoints';
import { Card, EmptyState, Skeleton } from '@/components/UI';
import { timeAgo } from '@/utils/format';
import { useSocketEvent } from '@/hooks/useSocket';
import { Pagination } from '@/components/Pagination';

const PAGE_SIZE = 20;

const ICONS: Record<string, any> = {
  REQUEST: Inbox,
  QUOTE: Inbox,
  BOOKING: Briefcase,
  MESSAGE: MessageCircle,
  REVIEW: Inbox,
  PAYMENT: DollarSign,
  SYSTEM: Bell,
  WORKER_APPROVAL: Bell,
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications', page], queryFn: () => notificationApi.list(page, PAGE_SIZE), refetchInterval: 10000 });
  useSocketEvent('notification_created', () => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
  const markAll = useMutation({ mutationFn: () => notificationApi.markAllRead(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
  const markOne = useMutation({ mutationFn: (id: string) => notificationApi.markRead(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });

  function handleClick(data: any) {
    const requestId = data?.requestId;
    const bookingId = data?.bookingId;
    if (bookingId) navigate(`/jobs/${bookingId}`);
    else if (requestId) navigate(`/requests/${requestId}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {data && data.unread > 0 && (
          <button onClick={() => markAll.mutate()} className="text-sm text-brand-700 inline-flex items-center gap-1 hover:underline">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState title="No notifications" description="New requests, bookings and messages will appear here." />
        ) : (
          data!.items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <Card
                key={n.id}
                className={`p-4 flex items-start gap-3 ${n.readAt ? '' : 'border-l-4 border-l-brand-500'}`}
                onClick={() => { if (!n.readAt) markOne.mutate(n.id); handleClick(n.data); }}
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{n.title}</div>
                  {n.body && <div className="text-sm text-gray-600 mt-0.5">{n.body}</div>}
                  <div className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />}
    </div>
  );
}
