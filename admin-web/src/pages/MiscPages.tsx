import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, AlertCircle, Bell, Trash2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton } from '@/components/UI';
import { useAdminAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Pagination } from '@/components/Pagination';

// ─── Reviews ───────────────────────────────────────────────────────
export function ReviewsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAdminAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, minRating],
    queryFn: () => adminApi.listReviews({ page, pageSize: 15, minRating }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => { toast.success('Review deleted'); qc.invalidateQueries({ queryKey: ['admin-reviews'] }); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('reviews.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('reviews.subtitle')}</p>
      </div>
      <div className="flex gap-2">
        {[undefined, 5, 4, 3, 2, 1].map((r) => (
          <Button key={r ?? 'all'} variant={minRating === r ? 'primary' : 'secondary'} onClick={() => { setMinRating(r); setPage(1); }}>
            {r ? `${r}+ stars` : 'All'}
          </Button>
        ))}
      </div>
      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState title="No reviews found" icon={Star} />
      ) : (
        <div className="space-y-3">
          {items.map((rev: any) => (
            <Card key={rev.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar src={rev.author?.avatarUrl} name={rev.author?.fullName} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{rev.author?.fullName || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">→ {rev.subject?.fullName || 'Unknown'}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{rev.comment || <em className="text-gray-400">No comment</em>}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    {rev.booking?.request?.service?.name && <span>{rev.booking.request.service.name}</span>}
                    <span className="ml-2">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {hasPermission('reviews:delete') && (
                  <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this review?')) deleteMut.mutate(rev.id); }}>
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={15} total={total} onPageChange={setPage} />
    </div>
  );
}

// ─── Disputes ──────────────────────────────────────────────────────
export function DisputesPage() {
  const { t } = useI18n();
  const { hasPermission } = useAdminAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [resolveModal, setResolveModal] = useState<{ id: string; resolution: string; refundAmount: number } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', page, status],
    queryFn: () => adminApi.listDisputes({ page, pageSize: 15, status }),
  });
  const resolveMut = useMutation({
    mutationFn: (body: { id: string; resolution: string; refundAmount?: number }) =>
      adminApi.resolveDispute(body.id, { resolution: body.resolution, refundAmount: body.refundAmount }),
    onSuccess: () => { toast.success('Dispute resolved'); setResolveModal(null); qc.invalidateQueries({ queryKey: ['admin-disputes'] }); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);
  const statusColor = (s: string) => {
    if (s === 'OPEN' || s === 'UNDER_REVIEW') return 'amber';
    if (s === 'RESOLVED') return 'green';
    return 'gray';
  };
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('disputes.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('disputes.subtitle')}</p>
      </div>
      <div className="flex gap-2">
        {['all', 'OPEN', 'UNDER_REVIEW', 'RESOLUED', 'REJECTED'].map((s) => (
          <Button key={s} variant={status === s ? 'primary' : 'secondary'} onClick={() => { setStatus(s); setPage(1); }}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </Button>
        ))}
      </div>
      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState title="No disputes" icon={AlertCircle} />
      ) : (
        <div className="space-y-3">
          {items.map((d: any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar src={d.opener?.avatarUrl} name={d.opener?.fullName} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{d.opener?.fullName || 'Unknown'}</span>
                    <Badge color={statusColor(d.status) as any}>{d.status.replace('_', ' ')}</Badge>
                    {d.booking?.total && <span className="text-xs text-gray-500">{d.booking.total.toLocaleString()} MMK</span>}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{d.description}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    Reason: {d.reason} | Service: {d.booking?.request?.service?.name || '—'} | {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                  {d.resolution && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                      <CheckCircle size={12} className="inline mr-1" /> {d.resolution}
                    </div>
                  )}
                </div>
                {hasPermission('disputes:resolve') && d.status !== 'RESOLVED' && d.status !== 'REJECTED' && (
                  <Button variant="primary" size="sm" onClick={() => setResolveModal({ id: d.id, resolution: '', refundAmount: 0 })}>
                    Resolve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={15} total={total} onPageChange={setPage} />
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold">Resolve Dispute</h3>
            <textarea className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="Resolution notes..." value={resolveModal.resolution} onChange={(e) => setResolveModal({ ...resolveModal, resolution: e.target.value })} />
            <input type="number" className="w-full border rounded-lg p-3 text-sm" placeholder="Refund amount (MMK, 0 = no refund)" value={resolveModal.refundAmount || ''} onChange={(e) => setResolveModal({ ...resolveModal, refundAmount: Number(e.target.value) })} />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setResolveModal(null)}>Cancel</Button>
              <Button disabled={!resolveModal.resolution || resolveMut.isPending} loading={resolveMut.isPending} onClick={() => resolveMut.mutate(resolveModal)}>
                Confirm Resolve
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Notifications ─────────────────────────────────────────────────
export function NotificationsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () => apiClient.get('/notifications', { params: { page, pageSize: 20 } }).then((r) => r.data.data),
  });
  const items = data?.items || [];
  const total = data?.total || 0;
  const unread = data?.unread || 0;
  const totalPages = Math.ceil(total / 20);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('notifications.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{unread > 0 ? `${unread} unread` : t('notifications.subtitle')}</p>
      </div>
      {isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <EmptyState title="No notifications" icon={Bell} description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => (
            <Card key={n.id} className={`p-4 ${!n.readAt ? 'border-l-4 border-indigo-400' : 'opacity-70'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'SYSTEM' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Bell size={14} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{n.body}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <Badge color={n.readAt ? 'gray' : 'indigo'}>{n.type}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}
