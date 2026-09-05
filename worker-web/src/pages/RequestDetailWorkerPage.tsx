import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { quoteApi, requestApi, chatApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Input, Skeleton, Spinner } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';
import { useSocketEvent } from '@/hooks/useSocket';

export function RequestDetailWorkerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [labor, setLabor] = useState(0);
  const [materials, setMaterials] = useState(0);
  const [additional, setAdditional] = useState(0);
  const [minutes, setMinutes] = useState(60);
  const [message, setMessage] = useState('');

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestApi.get(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  useSocketEvent('quote_accepted', (data: any) => {
    if (data.requestId === id) {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Customer accepted your quote!');
    }
  });
  useSocketEvent('quote_rejected', (data: any) => {
    if (data.requestId === id) {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast('Customer rejected your quote.', { icon: 'ℹ️' });
    }
  });
  useSocketEvent('request_cancelled', (data: any) => {
    if (data.requestId === id) {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.error('Customer cancelled the request');
    }
  });

  const myQuote = request?.quotes.find((q) => q.workerId === request?.customerId ? false : true);

  const quoteMutation = useMutation({
    mutationFn: () => quoteApi.create(id!, {
      laborAmount: Number(labor),
      materialsAmount: Number(materials),
      additionalFee: Number(additional),
      estimatedMinutes: Number(minutes),
      message,
    }),
    onSuccess: () => { toast.success('Quote sent'); queryClient.invalidateQueries({ queryKey: ['request', id] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Could not send quote'),
  });
  const withdraw = useMutation({
    mutationFn: (quoteId: string) => quoteApi.withdraw(quoteId),
    onSuccess: () => { toast.success('Quote withdrawn'); queryClient.invalidateQueries({ queryKey: ['request', id] }); },
  });

  async function startChat() {
    if (!request) return;
    try {
      const m = await chatApi.sendMessage({ recipientId: request.customerId, requestId: request.id, text: 'Hi about your request' });
      navigate(`/messages/${m.conversationId}`);
    } catch (e: any) { toast.error('Could not start chat'); }
  }

  if (isLoading) return <div className="max-w-3xl mx-auto p-8"><Skeleton className="h-72" /></div>;
  if (!request) return <EmptyState title="Request not found" />;

  const total = Number(labor) + Number(materials) + Number(additional);
  const existingQuote = (request as any).quotes?.find((q: any) => q.workerId === request?.customerId ? false : true) || null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <Link to="/requests" className="text-sm text-gray-500 inline-flex items-center hover:underline mb-3">
        <ArrowLeft size={14} className="mr-1" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm text-gray-500">Request #{request.id.slice(0, 8)}</div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{request.service.name}</h1>
            <div className="text-sm text-gray-500 mt-1">{request.service.category?.name} · {request.city}</div>
          </div>
          <Badge color="primary">{request.status.replace('_', ' ')}</Badge>
        </div>
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{request.description}</p>
        {request.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {request.photos.map((p) => <img key={p.id} src={p.url} alt="" className="aspect-square object-cover rounded-lg bg-gray-100" />)}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><div className="text-gray-500 text-xs">Customer</div><div className="font-medium">{request.customer.fullName}</div></div>
          <div><div className="text-gray-500 text-xs">When</div><div className="font-medium">{request.schedule.replace('_', ' ').toLowerCase()}</div></div>
          <div><div className="text-gray-500 text-xs">Budget</div><div className="font-medium">{request.minBudget || request.maxBudget ? `${formatMmk(request.minBudget)} – ${formatMmk(request.maxBudget)}` : '—'}</div></div>
          <div><div className="text-gray-500 text-xs">Posted</div><div className="font-medium">{timeAgo(request.createdAt)}</div></div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={startChat}><MessageCircle size={14} className="mr-2" /> Chat with customer</Button>
        </div>
      </Card>

      {/* Send a quote */}
      {!request.booking && (request.status === 'FINDING_WORKERS' || request.status === 'QUOTES_RECEIVED') && (
        <Card className="p-6 mt-6">
          <h2 className="font-semibold text-gray-900">Send a quote</h2>
          <p className="text-sm text-gray-500 mt-1">Set your price and an optional message. The customer can accept or reject.</p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Labor (MMK)" type="number" value={labor} onChange={(e) => setLabor(Number(e.target.value))} />
            <Input label="Materials (MMK)" type="number" value={materials} onChange={(e) => setMaterials(Number(e.target.value))} />
            <Input label="Additional fee" type="number" value={additional} onChange={(e) => setAdditional(Number(e.target.value))} />
            <Input label="Estimated minutes" type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
          </div>
          <div className="mt-3">
            <label className="text-sm font-medium text-gray-700">Message (optional)</label>
            <textarea
              className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="Add a note to the customer"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">Total: <span className="font-bold text-gray-900">{formatMmk(total)}</span></div>
            <Button disabled={total <= 0 || quoteMutation.isPending} onClick={() => quoteMutation.mutate()}>
              {quoteMutation.isPending ? <Spinner size={16} /> : <><Send size={14} className="mr-2" /> Send quote</>}
            </Button>
          </div>
        </Card>
      )}

      {/* Existing quote status */}
      {request.quotes.length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="font-semibold text-gray-900">Your quote</h2>
          {request.quotes.map((q) => (
            <div key={q.id} className="mt-3 flex items-center justify-between gap-2 border rounded-lg p-3">
              <div>
                <div className="font-medium">{formatMmk(q.totalAmount)}</div>
                <div className="text-xs text-gray-500">Status: {q.status} · sent {timeAgo(q.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={q.status === 'ACCEPTED' ? 'green' : q.status === 'REJECTED' ? 'red' : 'gray'}>{q.status}</Badge>
                {q.status === 'PENDING' && <Button size="sm" variant="ghost" onClick={() => withdraw.mutate(q.id)}>Withdraw</Button>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {request.booking && (
        <Card className="p-6 mt-6 bg-green-50 border-green-200">
          <h2 className="font-semibold text-green-900">Booking confirmed</h2>
          <p className="text-sm text-green-800 mt-1">The customer accepted your quote. Manage this job in the Jobs section.</p>
          <Link to={`/jobs/${request.booking.id}`} className="inline-block mt-3"><Button>Open job</Button></Link>
        </Card>
      )}
    </div>
  );
}