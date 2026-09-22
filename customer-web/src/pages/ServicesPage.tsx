import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categoryApi, workerApi, eventApi } from '@/api/endpoints';
import { WorkerCard } from '@/components/WorkerCard';
import { Button, Card, EmptyState, Input, Select, Skeleton } from '@/components/UI';
import { Pagination } from '@/components/Pagination';
import { useUrlPagination } from '@/hooks/usePagination';
import { Filter, X } from 'lucide-react';

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full text-xs font-medium">
      {label}
      <button onClick={onClear} className="hover:text-brand-900" aria-label={`Remove ${label}`}>
        <X size={12} />
      </button>
    </span>
  );
}

export function ServicesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [openFilters, setOpenFilters] = useState(false);
  const lastLoggedKey = useRef<string>('');

  const filters = useMemo(() => ({
    q: params.get('q') ?? undefined,
    service: params.get('service') ?? undefined,
    category: params.get('category') ?? undefined,
    city: params.get('city') ?? undefined,
    minRating: params.get('minRating') ? Number(params.get('minRating')) : undefined,
    maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
    sort: (params.get('sort') as any) ?? 'RECOMMENDED',
    page: params.get('page') ? Number(params.get('page')) : 1,
    verifiedOnly: params.get('verifiedOnly') === 'true',
    emergency: params.get('emergency') === 'true',
    pageSize: 12,
  }), [params]);

  const { page, pageSize, setPage } = useUrlPagination(params, setParams, 12);

  // Log a single "search" event per unique filter combination.
  useEffect(() => {
    const key = JSON.stringify(filters);
    if (key === lastLoggedKey.current) return;
    lastLoggedKey.current = key;
    if (!filters.q && !filters.service && !filters.category && !filters.city) return;
    eventApi.log({
      type: 'search',
      query: filters.q,
      serviceSlug: filters.service,
      categorySlug: filters.category,
      city: filters.city,
    }).catch(() => { /* fire-and-forget */ });
  }, [filters]);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });

  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers-search', filters],
    queryFn: () => workerApi.search(filters as any),
  });

  function update(key: string, value: any) {
    const newParams = new URLSearchParams(params);
    if (value === undefined || value === '' || value === false) newParams.delete(key);
    else newParams.set(key, String(value));
    newParams.delete('page');
    setParams(newParams);
  }

  function changeSort(v: string) {
    const newParams = new URLSearchParams(params);
    newParams.set('sort', v);
    setParams(newParams);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a worker</h1>
          <p className="text-sm text-gray-500 mt-1">{workers?.total ?? 0} workers available</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search workers"
            defaultValue={filters.q ?? ''}
            onKeyDown={(e) => e.key === 'Enter' && update('q', (e.target as HTMLInputElement).value)}
            className="sm:min-w-[200px]"
          />
          <Select
            value={filters.sort}
            onChange={(e) => changeSort(e.target.value)}
            options={[
              { value: 'RECOMMENDED', label: 'Recommended' },
              { value: 'NEAREST', label: 'Nearest' },
              { value: 'HIGHEST_RATED', label: 'Highest rated' },
              { value: 'LOWEST_PRICE', label: 'Lowest price' },
              { value: 'MOST_EXPERIENCED', label: 'Most experienced' },
            ]}
          />
          <Button variant="outline" onClick={() => setOpenFilters(!openFilters)}>
            <Filter size={16} className="mr-2" /> {openFilters ? 'Hide' : 'Filters'}
          </Button>
        </div>
      </div>

      {/* Active filter chips */}
      {(filters.service || filters.category || filters.city || filters.minRating || filters.maxPrice || filters.verifiedOnly || filters.emergency) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.service && <Chip label={`Service: ${filters.service}`} onClear={() => update('service', undefined)} />}
          {filters.category && <Chip label={`Category: ${filters.category}`} onClear={() => update('category', undefined)} />}
          {filters.city && <Chip label={`City: ${filters.city}`} onClear={() => update('city', undefined)} />}
          {filters.minRating && <Chip label={`Rating: ${filters.minRating}+`} onClear={() => update('minRating', undefined)} />}
          {filters.maxPrice && <Chip label={`Max: ${filters.maxPrice.toLocaleString()} MMK`} onClear={() => update('maxPrice', undefined)} />}
          {filters.verifiedOnly && <Chip label="Verified only" onClear={() => update('verifiedOnly', false)} />}
          {filters.emergency && <Chip label="24/7" onClear={() => update('emergency', false)} />}
          <button
            onClick={() => setParams(new URLSearchParams())}
            className="text-xs text-red-600 hover:underline px-2 py-1"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
          <aside className={`md:block ${openFilters ? 'block' : 'hidden'}`}>
            <Card className="p-5 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <Input
                    placeholder="Yangon"
                    defaultValue={filters.city ?? ''}
                    onBlur={(e) => update('city', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <Select
                    value={filters.category ?? ''}
                    onChange={(e) => update('category', e.target.value || undefined)}
                    options={[
                      { value: '', label: 'Any' },
                      ...(categories ?? []).map((c) => ({ value: c.slug, label: c.name })),
                    ]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Service</label>
                  <Select
                    value={filters.service ?? ''}
                    onChange={(e) => update('service', e.target.value || undefined)}
                    options={[
                      { value: '', label: 'Any' },
                      ...(categories?.flatMap((c) => c.services).map((s) => ({ value: s.slug, label: s.name })) ?? []),
                    ]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max price (MMK)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 30000"
                    defaultValue={filters.maxPrice ?? ''}
                    onBlur={(e) => update('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Min rating</label>
                  <Select
                    value={filters.minRating ?? ''}
                    onChange={(e) => update('minRating', e.target.value || undefined)}
                    options={[
                      { value: '', label: 'Any' },
                      { value: '4.5', label: '4.5+' },
                      { value: '4', label: '4+' },
                      { value: '3.5', label: '3.5+' },
                    ]}
                    className="mt-1"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => update('verifiedOnly', e.target.checked)}
                  />
                  Verified workers only
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.emergency}
                    onChange={(e) => update('emergency', e.target.checked)}
                  />
                  Emergency available
                </label>
              </div>
            </Card>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border p-4">
                    <Skeleton className="aspect-[16/9] mb-3" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (workers?.items.length ?? 0) === 0 ? (
              <EmptyState
                title="No workers match your filters"
                description="Try adjusting your filters or browse popular services."
                action={<Button onClick={() => navigate('/services')}>Clear filters</Button>}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workers!.items.map((w) => {
                    const isBoosted = (w as any).boosted;
                    const src = isBoosted ? 'boost' : 'search';
                    return <WorkerCard key={w.id} worker={w} source={src} />;
                  })}
                </div>
                {workers && workers.total > pageSize && (
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={workers.total}
                    onChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
    </div>
  );
}