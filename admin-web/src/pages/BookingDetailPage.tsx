import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/endpoints';
import { Card, Badge, Button, Spinner } from '@/components/UI';
import { formatDate, formatMmk } from '@/utils/format';

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['admin-booking', id],
    queryFn: () => adminApi.getBooking(id!),
    enabled: !!id,
  });

  const refundMut = useMutation({
    mutationFn: () => adminApi.refundBooking(id!, Number(refundAmount || booking?.total || 0), refundReason || 'Admin refund'),
    onSuccess: () => {
      toast.success('Refund processed');
      setRefundAmount('');
      setRefundReason('');
      qc.invalidateQueries({ queryKey: ['admin-booking', id] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Refund failed'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={32} /></div>;
  if (isError || !booking) return <Card><p className="text-red-600">Booking not found.</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/bookings')}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Booking #{booking.id.slice(0, 8)}</h1>
          <Badge>{booking.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-32"
            placeholder={`Amount (${booking.total})`}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <input
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Refund reason..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
          <Button variant="danger" onClick={() => refundMut.mutate()} disabled={refundMut.isPending}>
            <RotateCcw size={16} className="mr-1" /> Refund
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Booking Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">ID</dt><dd className="font-mono">{booking.id}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Service</dt><dd>{booking.request?.service?.name || '—'}</dd></div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Customer</dt>
              <dd><Link to={`/users/${booking.customerId}`} className="text-indigo-600 hover:underline">{booking.customer?.fullName}</Link></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Worker</dt>
              <dd>
                {booking.worker?.workerProfile?.id ? (
                  <Link to={`/workers/${booking.worker.workerProfile.id}`} className="text-indigo-600 hover:underline">{booking.worker?.fullName}</Link>
                ) : (
                  booking.worker?.fullName || '—'
                )}
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd>{formatDate(booking.createdAt)}</dd></div>
            {booking.request?.addressText && (
              <div className="flex justify-between"><dt className="text-slate-500">Address</dt><dd>{booking.request.addressText}</dd></div>
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Financials & Payment</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatMmk(booking.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Platform Fee</dt><dd>{formatMmk(booking.platformFee)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Worker Earnings</dt><dd>{formatMmk(booking.workerEarnings)}</dd></div>
            <div className="flex justify-between font-semibold border-t pt-2"><dt>Total</dt><dd>{formatMmk(booking.total)}</dd></div>
            <div className="flex justify-between pt-2">
              <dt className="text-slate-500">Payment Status</dt>
              <dd><Badge>{booking.payment?.status || 'UNPAID'}</Badge></dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
