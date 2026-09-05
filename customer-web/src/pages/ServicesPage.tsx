import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categoryApi, workerApi } from '@/api/endpoints';
import { WorkerCard } from '@/components/WorkerCard';
import { Button, Card, EmptyState, Input, Select, Skeleton, Spinner } from '@/components/UI';
import { Filter, Search } from 'lucide-react';

export function ServicesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [openFilters, setOpenFilters] = useState(false);

  const filters = useMemo(() => ({
    q: params.get('q') ?? undefined,
    service: params.get('service') ?? undefined,
    category: params.get('category') ?? undefined,
    city: params.get('city') ?? undefined,
    minRating: params.get('minRating') ? Number(params.get('minRating')) : undefined,
    sort: (params.get('sort') as any) ?? 'RECOMMENDED',
    page: params.get('page') ? Number(params.get('page')) : 1,
    verifiedOnly: params.get('verifiedOnly') === 'true',
    emergency: params.get('emergency') === 'true',
    pageSize: 12,
  }), [params]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a worker</h1>
          <p className="text-sm text-gray-500 mt-1">{workers?.total ?? 0} workers available</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search workers"
            defaultValue={filters.q ?? ''}
            onKeyDown={(e) => e.key === 'Enter' && update('q', (e.target as HTMLInputElement).value)}
            className="min-w-[200px]"
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
            <Filter size={16} className="mr-2" /> Filters
          </Button>
        </div>
      </div>

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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workers!.items.map((w) => <WorkerCard key={w.id} worker={w} />)}
                </div>
                {workers && workers.total > workers.pageSize && (
                  <div className="mt-8 flex justify-center gap-2">
                    {Array.from({ length: Math.ceil(workers.total / workers.pageSize) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => update('page', i + 1)}
                        className={`px-3 py-1 rounded-lg ${filters.page === i + 1 ? 'bg-brand-600 text-white' : 'bg-white border'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </div>
  );
}