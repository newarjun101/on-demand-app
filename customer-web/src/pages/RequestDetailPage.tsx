import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle2, Clock, MessageCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestApi, quoteApi, chatApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Spinner, StarRating } from '@/components/UI';
import { REQUEST_STATUS_FLOW, REQUEST_STATUS_LABELS, statusIndex } from '@/utils/statuses';
import { formatDate, formatMmk } from '@/utils/format';
import { useSocketEvent } from '@/hooks/useSocket';
import { useEffect } from 'react';
import { ReviewModal } from '@/components/ReviewModal';
import { PaymentModal } from '@/components/PaymentModal';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReview, setShowReview] = useState(false);
  const [showPay, setShowPay] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestApi.get(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      const data: any = q.state.data;
      if (!data) return 5000;
      if (['COMPLETED', 'CANCELLED'].includes(data.status) && data.booking?.payment?.status === 'PAID') return false;
      return 5000;
    },
  });

  // Listen to relevant events
  useSocketEvent('quote_created', () => queryClient.invalidateQueries({ queryKey: ['request', id] }));
  useSocketEvent('quote_accepted', () => queryClient.invalidateQueries({ queryKey: ['request', id] }));
  useSocketEvent('quote_rejected', () => queryClient.invalidateQueries({ queryKey: ['request', id] }));
  useSocketEvent('booking_status_changed', () => queryClient.invalidateQueries({ queryKey: ['request', id] }));

  const accept = useMutation({
    mutationFn: (quoteId: string) => quoteApi.accept(quoteId),
    onSuccess: () => { toast.success('Quote accepted — booking created'); queryClient.invalidateQueries({ queryKey: ['request', id] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Could not accept'),
  });
  const reject = useMutation({
    mutationFn: (quoteId: string) => quoteApi.reject(quoteId),
    onSuccess: () => { toast.success('Quote rejected'); queryClient.invalidateQueries({ queryKey: ['request', id] }); },
  });
  const cancelReq = useMutation({
    mutationFn: () => requestApi.cancel(id!),
    onSuccess: () => { toast.success('Request cancelled'); queryClient.invalidateQueries({ queryKey: ['request', id] }); },
  });

  async function startChat(workerId: string) {
    try {
      const msg = await chatApi.sendMessage({ recipientId: workerId, requestId: id, text: 'Hi about my request' });
      navigate(`/messages/${msg.conversationId}`);
    } catch (e: any) {
      toast.error('Could not start chat');
    }
  }

  if (isLoading) {
    return <div className="max-w-5xl mx-auto px-4 py-8"><Skeleton className="h-24 mb-4" /><Skeleton className="h-72" /></div>;
  }
  if (!request) return <EmptyState title="Request not found" />;

  const status = request.status;
  const idx = statusIndex(status);
  const booking = request.booking;
  const isCompleted = booking?.status === 'COMPLETED';
  const isPaid = booking?.payment?.status === 'PAID';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Request #{request.id.slice(0, 8)}</div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{request.service.name}</h1>
            <div className="text-sm text-gray-500 mt-1">{request.service.category?.name} · {request.city}</div>
          </div>
          <Badge color={status === 'CANCELLED' ? 'red' : 'primary'}>{REQUEST_STATUS_LABELS[status]}</Badge>
        </div>
        <p className="text-sm text-gray-700 mt-4 whitespace-pre-line">{request.description}</p>
        {request.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {request.photos.map((p) => (
              <img key={p.id} src={p.url} className="aspect-square object-cover rounded-lg bg-gray-100" alt="" />
            ))}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Schedule</div>
            <div className="font-medium">{REQUEST_STATUS_LABELS[request.schedule] ?? request.schedule}</div>
          </div>
          <div>
            <div className="text-gray-500">Budget</div>
            <div className="font-medium">
              {request.minBudget || request.maxBudget
                ? `${formatMmk(request.minBudget)} – ${formatMmk(request.maxBudget)}`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Address</div>
            <div className="font-medium truncate">{request.addressLine}</div>
          </div>
          <div>
            <div className="text-gray-500">Created</div>
            <div className="font-medium">{formatDate(request.createdAt)}</div>
          </div>
        </div>
      </Card>

      {/* Progress tracker */}
      <Card className="p-6 mt-6">
        <h2 className="font-semibold text-gray-900 mb-4">Progress</h2>
        <div className="overflow-x-auto">
          <ol className="flex items-center min-w-[700px] gap-1">
            {REQUEST_STATUS_FLOW.map((step, i) => {
              const done = i <= idx;
              const active = i === idx;
              return (
                <li key={step} className="flex-1 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${done ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'} ${active ? 'ring-4 ring-brand-100' : ''}`}>
                    {done ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <div className={`mt-1.5 text-[10px] text-center leading-tight ${done ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>{REQUEST_STATUS_LABELS[step]}</div>
                  {i < REQUEST_STATUS_FLOW.length - 1 && (
                    <div className={`hidden`} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </Card>

      {/* Quotes */}
      {request.quotes.length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Worker quotes ({request.quotes.length})</h2>
          <div className="space-y-3">
            {request.quotes.map((q) => {
              const accepted = q.status === 'ACCEPTED';
              const rejected = q.status === 'REJECTED' || q.status === 'WITHDRAWN';
              return (
                <div key={q.id} className={`p-4 rounded-xl border ${accepted ? 'border-green-400 bg-green-50' : rejected ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <Avatar src={q.worker?.avatarUrl ?? null} name={q.worker?.fullName ?? 'Worker'} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900">{q.worker?.fullName}</div>
                          <div className="text-xs text-gray-500">
                            <StarRating value={q.worker?.workerProfile?.ratingAverage ?? 0} />
                            <span className="ml-1">{(q.worker?.workerProfile?.ratingAverage ?? 0).toFixed(1)} · {q.worker?.workerProfile?.completedJobs ?? 0} jobs</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="text-lg font-bold text-gray-900">{formatMmk(q.totalAmount)}</div>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div><div className="text-xs text-gray-500">Labor</div>{formatMmk(q.laborAmount)}</div>
                        <div><div className="text-xs text-gray-500">Materials</div>{formatMmk(q.materialsAmount)}</div>
                        <div><div className="text-xs text-gray-500">Additional</div>{formatMmk(q.additionalFee)}</div>
                      </div>
                      {q.message && <p className="mt-2 text-sm text-gray-700 italic">"{q.message}"</p>}
                      {q.estimatedMinutes && (
                        <div className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1"><Clock size={12} />~{q.estimatedMinutes} min</div>
                      )}
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {!accepted && !rejected && status !== 'BOOKING_CONFIRMED' && status !== 'CANCELLED' && (
                          <>
                            <Button onClick={() => accept.mutate(q.id)} disabled={accept.isPending}>
                              {accept.isPending ? <Spinner size={14}/> : 'Accept'}
                            </Button>
                            <Button variant="outline" onClick={() => reject.mutate(q.id)}>Reject</Button>
                            <Button variant="ghost" onClick={() => q.workerId && startChat(q.workerId)}><MessageCircle size={14} className="mr-1"/>Chat</Button>
                          </>
                        )}
                        {accepted && <Badge color="green">Accepted</Badge>}
                        {rejected && <Badge color="gray">{q.status}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Booking status */}
      {booking && (
        <Card className="p-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-gray-500">Booking #{booking.id.slice(0, 8)}</div>
              <h2 className="text-lg font-semibold text-gray-900 mt-1">{booking.worker?.fullName}</h2>
              <div className="text-sm text-gray-500 mt-1">{booking.request?.service.name}</div>
            </div>
            <Badge color={booking.status === 'COMPLETED' ? 'green' : 'primary'}>{booking.status.replace('_', ' ')}</Badge>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            <div><div className="text-gray-500">Total</div><div className="font-semibold">{formatMmk(booking.total)}</div></div>
            <div><div className="text-gray-500">Platform fee</div><div className="font-semibold">{formatMmk(booking.platformFee)}</div></div>
            <div><div className="text-gray-500">Worker earns</div><div className="font-semibold">{formatMmk(booking.workerEarnings)}</div></div>
          </div>
          {isCompleted && !isPaid && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-2">
              <div className="text-sm">Job completed. Please pay the worker.</div>
              <Button onClick={() => setShowPay(true)}>Pay now</Button>
            </div>
          )}
          {isPaid && !booking.review && (
            <div className="mt-4 p-4 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between gap-2">
              <div className="text-sm">Payment received. How was the service?</div>
              <Button onClick={() => setShowReview(true)}>Leave review</Button>
            </div>
          )}
          {booking.review && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2"><StarRating value={booking.review.rating} /><span className="text-sm font-medium">{booking.review.rating}/5</span></div>
              {booking.review.comment && <p className="text-sm mt-1">{booking.review.comment}</p>}
            </div>
          )}
        </Card>
      )}

      <div className="mt-6 flex justify-end">
        {!['BOOKING_CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED'].includes(status) && (
          <Button variant="ghost" onClick={() => { if (confirm('Cancel this request?')) cancelReq.mutate(); }}>
            <X size={16} className="mr-2" /> Cancel request
          </Button>
        )}
      </div>

      {showReview && booking && (
        <ReviewModal
          bookingId={booking.id}
          onClose={() => setShowReview(false)}
          onSubmitted={() => { queryClient.invalidateQueries({ queryKey: ['request', id] }); setShowReview(false); }}
        />
      )}
      {showPay && booking && (
        <PaymentModal
          booking={booking}
          onClose={() => setShowPay(false)}
          onPaid={() => { queryClient.invalidateQueries({ queryKey: ['request', id] }); setShowPay(false); }}
        />
      )}
    </div>
  );
}