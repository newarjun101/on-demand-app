import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, MapPin, Wrench } from 'lucide-react';
import { requestApi } from '@/api/endpoints';
import { Badge, Button, Card, EmptyState, Input, Select, Skeleton } from '@/components/UI';
import { Avatar } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';

export function RequestsPage() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('RECOMMENDED');
  const { data, isLoading } = useQuery({
    queryKey: ['request-feed', { q, sort }],
    queryFn: () => requestApi.feed(1, 50),
  });

  const items = (data?.items ?? []).filter((r) => !q || `${r.service.name} ${r.description} ${r.city}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job requests near you</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} open requests</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search requests" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No requests match"
          description="Try changing your filters or expanding your service radius."
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Wrench size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/requests/${r.id}`} className="font-semibold hover:underline">{r.service.name}</Link>
                    <div className="text-xs text-gray-500">{timeAgo(r.createdAt)}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{r.description.slice(0, 120)}{r.description.length > 120 ? '…' : ''}</div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                    <div className="inline-flex items-center gap-1"><MapPin size={12} />{r.city}</div>
                    <div>Budget: {r.minBudget || r.maxBudget ? `${formatMmk(r.minBudget)} – ${formatMmk(r.maxBudget)}` : '—'}</div>
                    <div>When: {r.schedule.replace('_', ' ').toLowerCase()}</div>
                    <div>By: {r.customer.fullName}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    {r.quotes.length > 0 && <Badge color="green">You quoted</Badge>}
                    <Link to={`/requests/${r.id}`}>
                      <Button size="sm">View request</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}