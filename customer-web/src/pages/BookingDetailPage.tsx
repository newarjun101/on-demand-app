import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { bookingApi, chatApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Spinner } from '@/components/UI';
import { formatDate, formatMmk } from '@/utils/format';
import { BOOKING_STATUS_LABELS } from '@/utils/statuses';
import { PaymentModal } from '@/components/PaymentModal';
import { ReviewModal } from '@/components/ReviewModal';
import { useSocketEvent } from '@/hooks/useSocket';
import { MessageCircle, MapPin, Phone, Star } from 'lucide-react';

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPay, setShowPay] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  useSocketEvent('booking_status_changed', () => queryClient.invalidateQueries({ queryKey: ['booking', id] }));

  const cancel = useMutation({
    mutationFn: () => bookingApi.cancel(id!),
    onSuccess: () => { toast.success('Booking cancelled'); queryClient.invalidateQueries({ queryKey: ['booking', id] }); },
  });

  if (isLoading) return <div className="max-w-3xl mx-auto p-8"><Skeleton className="h-72" /></div>;
  if (!booking) return <EmptyState title="Booking not found" />;

  const isCompleted = booking.status === 'COMPLETED';
  const isPaid = booking.payment?.status === 'PAID';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm text-gray-500">Booking #{booking.id.slice(0, 8)}</div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{booking.request?.service.name}</h1>
            <div className="text-sm text-gray-500 mt-1">{booking.request?.service.category?.name}</div>
          </div>
          <Badge color={booking.status === 'COMPLETED' ? 'green' : booking.status === 'CANCELLED' ? 'red' : 'primary'}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <Avatar src={booking.worker?.avatarUrl ?? null} name={booking.worker?.fullName ?? ''} size={56} />
          <div className="flex-1">
            <div className="font-semibold">{booking.worker?.fullName}</div>
            <div className="text-xs text-gray-500">Worker</div>
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const m = await chatApi.sendMessage({ recipientId: booking.workerId, text: 'Hi' });
                navigate(`/messages/${m.conversationId}`);
              } catch {}
            }}>
              <MessageCircle size={14} className="mr-1" /> Chat
            </Button>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Location</div>
            <div className="font-medium">{booking.request?.addressLine}</div>
            <div className="text-gray-500 text-xs">{booking.request?.city}{booking.request?.landmark ? ` · ${booking.request.landmark}` : ''}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Schedule</div>
            <div className="font-medium">{formatDate(booking.scheduledAt)}</div>
            {booking.startedAt && <div className="text-gray-500 text-xs">Started: {formatDate(booking.startedAt)}</div>}
            {booking.completedAt && <div className="text-gray-500 text-xs">Completed: {formatDate(booking.completedAt)}</div>}
          </div>
        </div>

        <div className="mt-6 border-t pt-4 grid grid-cols-3 gap-3 text-sm">
          <div><div className="text-xs text-gray-500">Subtotal</div><div className="font-semibold">{formatMmk(booking.subtotal)}</div></div>
          <div><div className="text-xs text-gray-500">Platform fee</div><div className="font-semibold">{formatMmk(booking.platformFee)}</div></div>
          <div><div className="text-xs text-gray-500">Total</div><div className="font-semibold text-brand-700">{formatMmk(booking.total)}</div></div>
        </div>

        {booking.payment && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm flex justify-between">
            <span>Payment via {booking.payment.method.replace('_', ' ').toLowerCase()}</span>
            <span className="font-medium text-green-700">{booking.payment.status}</span>
          </div>
        )}

        {isCompleted && !isPaid && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-2">
            <div className="text-sm">Job completed. Please pay the worker.</div>
            <Button onClick={() => setShowPay(true)}>Pay now</Button>
          </div>
        )}
        {isPaid && !booking.review && (
          <div className="mt-4 p-4 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between gap-2">
            <div className="text-sm">How was the service?</div>
            <Button onClick={() => setShowReview(true)}>Leave review</Button>
          </div>
        )}
        {booking.review && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map((n) => <Star key={n} size={16} fill={n <= booking.review!.rating ? '#facc15' : '#e5e7eb'} stroke={n <= booking.review!.rating ? '#facc15' : '#e5e7eb'} />)}
              <span className="text-sm font-medium">{booking.review.rating}/5</span>
            </div>
            {booking.review.comment && <p className="text-sm mt-1">{booking.review.comment}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          {['CONFIRMED', 'ON_THE_WAY', 'ARRIVED'].includes(booking.status) && (
            <Button variant="ghost" onClick={() => { if (confirm('Cancel this booking?')) cancel.mutate(); }}>
              Cancel booking
            </Button>
          )}
        </div>
      </Card>

      {showPay && <PaymentModal booking={booking} onClose={() => setShowPay(false)} onPaid={() => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); setShowPay(false); }} />}
      {showReview && <ReviewModal bookingId={booking.id} onClose={() => setShowReview(false)} onSubmitted={() => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); setShowReview(false); }} />}
    </div>
  );
}