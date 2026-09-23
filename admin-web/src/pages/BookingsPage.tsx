import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi, AdminBooking } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Badge, Button, Card, EmptyState, Input, Select, Skeleton, Spinner } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';
import { useAdminAuth } from '@/contexts/AuthContext';
import { Pagination } from '@/components/Pagination';

export function BookingsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAdminAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [refundModal, setRefundModal] = useState<{ booking: AdminBooking; amount: number; reason: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, status, q],
    queryFn: () => adminApi.listBookings({ page, pageSize: 20, status }),
  });

  const refundMut = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
      adminApi.refundBooking(id, amount, reason),
    onSuccess: () => { toast.success(t('bookings.refund') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); setRefundModal(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('bookings.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('bookings.subtitle')}</p>
      </div>

      <Card className="p-3 flex flex-col sm:flex-row gap-2">
        <Input placeholder={t('bookings.search')} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[
          { value: 'all', label: t('common.all') },
          { value: 'CONFIRMED',   label: 'Confirmed' },
          { value: 'ON_THE_WAY',  label: 'On the way' },
          { value: 'ARRIVED',     label: 'Arrived' },
          { value: 'IN_PROGRESS', label: 'In progress' },
          { value: 'COMPLETED',   label: 'Completed' },
          { value: 'CANCELLED',   label: 'Cancelled' },
          { value: 'DISPUTED',    label: 'Disputed' },
        ]} />
      </Card>

      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.items.length === 0 ? (
        <EmptyState title="No bookings" />
      ) : (
        <Card>
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3">{t('auth.fullName')}</th>
                <th className="text-left py-2 px-3">{t('bookings.service')}</th>
                <th className="text-right py-2 px-3">{t('bookings.amount')}</th>
                <th className="text-right py-2 px-3">{t('bookings.fee')}</th>
                <th className="text-left py-2 px-3">{t('common.status')}</th>
                <th className="text-left py-2 px-3">{t('common.created')}</th>
                <th className="text-right py-2 px-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <div className="font-medium">{b.customerName}</div>
                    <div className="text-xs text-gray-500">→ {b.workerName}</div>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{b.serviceName}</td>
                  <td className="py-2 px-3 text-right font-medium">{formatMmk(b.total)}</td>
                  <td className="py-2 px-3 text-right text-gray-500">{formatMmk(b.platformFee)}</td>
                  <td className="py-2 px-3">
                    <Badge color={b.status === 'COMPLETED' ? 'green' : b.status === 'CANCELLED' ? 'red' : 'indigo'}>{b.status}</Badge>
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500">{timeAgo(b.createdAt)}</td>
                  <td className="py-2 px-3 text-right">
                    {hasPermission('bookings:refund') && b.status === 'COMPLETED' && (
                      <Button size="sm" variant="outline" onClick={() => setRefundModal({ booking: b, amount: b.total, reason: '' })}>
                        <RefreshCw size={14} className="mr-1" /> {t('bookings.refund')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}

      {refundModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold">{t('bookings.refund')}</h3>
            <p className="text-sm text-gray-500 mt-1">{refundModal.booking.serviceName} · {refundModal.booking.customerName}</p>
            <div className="mt-3">
              <label className="text-sm font-medium">{t('bookings.refundAmount')}</label>
              <Input type="number" value={refundModal.amount} onChange={(e) => setRefundModal({ ...refundModal, amount: Number(e.target.value) })} />
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium">{t('bookings.reason') || t('users.banReason')}</label>
              <textarea className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={3} value={refundModal.reason} onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRefundModal(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" disabled={!refundModal.reason || refundMut.isPending} loading={refundMut.isPending} onClick={() => refundMut.mutate({ id: refundModal.booking.id, amount: refundModal.amount, reason: refundModal.reason })}>
                {t('bookings.refund')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
