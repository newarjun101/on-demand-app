import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, MessageCircle, Navigation, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingApi, chatApi, workerApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Spinner, StarRating } from '@/components/UI';
import { formatDate, formatMmk } from '@/utils/format';
import { BOOKING_STATUS_LABELS, nextActionFor } from '@/utils/statuses';
import { useSocketEvent } from '@/hooks/useSocket';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sharingLocation, setSharingLocation] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id!),
    enabled: !!id,
    refetchInterval: 6000,
  });

  useSocketEvent('booking_status_changed', (data: any) => {
    if (data.bookingId === id) {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ status, lat, lng }: { status: string; lat?: number; lng?: number }) =>
      bookingApi.updateStatus(id!, status, lat, lng),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Update failed'),
  });

  function shareLocationThen(next: string) {
    if (!navigator.geolocation) {
      updateStatus.mutate({ status: next });
      return;
    }
    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateStatus.mutate({ status: next, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSharingLocation(false);
      },
      () => { updateStatus.mutate({ status: next }); setSharingLocation(false); },
    );
  }

  if (isLoading) return <div className="max-w-3xl mx-auto p-8"><Skeleton className="h-72" /></div>;
  if (!booking) return <EmptyState title="Job not found" />;

  const action = nextActionFor(booking.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <Link to="/jobs" className="text-sm text-gray-500 inline-flex items-center hover:underline mb-3">
        <ArrowLeft size={14} className="mr-1" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm text-gray-500">Job #{booking.id.slice(0, 8)}</div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{booking.request?.service.name}</h1>
            <div className="text-sm text-gray-500 mt-1">{booking.request?.service.category?.name}</div>
          </div>
          <Badge color={booking.status === 'COMPLETED' ? 'green' : booking.status === 'CANCELLED' ? 'red' : 'primary'}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <Avatar src={booking.customer?.avatarUrl ?? null} name={booking.customer?.fullName ?? ''} size={56} />
          <div className="flex-1">
            <div className="font-semibold">{booking.customer?.fullName}</div>
            <div className="text-xs text-gray-500">Customer</div>
          </div>
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              const m = await chatApi.sendMessage({ recipientId: booking.customerId, text: 'Hi' });
              navigate(`/messages/${m.conversationId}`);
            } catch {}
          }}>
            <MessageCircle size={14} className="mr-1" /> Chat
          </Button>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Location</div>
            <div className="font-medium">{booking.request?.addressLine}</div>
            <div className="text-gray-500 text-xs">{booking.request?.city}{booking.request?.landmark ? ` · ${booking.request.landmark}` : ''}</div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${booking.request?.latitude},${booking.request?.longitude}`}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-flex items-center text-sm text-brand-700 hover:underline"
            >
              <Navigation size={14} className="mr-1" /> Open in maps
            </a>
          </div>
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Schedule</div>
            <div className="font-medium">{formatDate(booking.scheduledAt)}</div>
            {booking.startedAt && <div className="text-gray-500 text-xs">Started: {formatDate(booking.startedAt)}</div>}
            {booking.arrivedAt && <div className="text-gray-500 text-xs">Arrived: {formatDate(booking.arrivedAt)}</div>}
            {booking.completedAt && <div className="text-gray-500 text-xs">Completed: {formatDate(booking.completedAt)}</div>}
          </div>
        </div>

        {booking.request?.description && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-line">
            {booking.request.description}
          </div>
        )}

        <div className="mt-6 border-t pt-4 grid grid-cols-3 gap-3 text-sm">
          <div><div className="text-xs text-gray-500">Subtotal</div><div className="font-semibold">{formatMmk(booking.subtotal)}</div></div>
          <div><div className="text-xs text-gray-500">Platform fee</div><div className="font-semibold text-red-600">−{formatMmk(booking.platformFee)}</div></div>
          <div><div className="text-xs text-gray-500">You earn</div><div className="font-semibold text-brand-700">{formatMmk(booking.workerEarnings)}</div></div>
        </div>

        {booking.payment && booking.payment.status === 'PAID' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 size={16} /> Payment received: {formatMmk(booking.payment.amount)}
          </div>
        )}

        {booking.review && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <div className="flex items-center gap-2"><StarRating value={booking.review.rating} /><span className="font-medium">{booking.review.rating}/5</span></div>
            {booking.review.comment && <p className="text-gray-700 mt-1">{booking.review.comment}</p>}
          </div>
        )}

        {/* Action button */}
        {action && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => shareLocationThen(action.next)} disabled={updateStatus.isPending || sharingLocation}>
              {updateStatus.isPending || sharingLocation ? <Spinner size={16} /> : action.label}
            </Button>
            <Button variant="ghost" onClick={() => updateStatus.mutate({ status: 'CANCELLED' })}>
              <XCircle size={14} className="mr-2" /> Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}