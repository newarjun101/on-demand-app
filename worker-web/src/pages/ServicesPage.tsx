import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Check, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { categoryApi, workerApi } from '@/api/endpoints';
import { Button, Card, EmptyState, Input, Skeleton, Spinner } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';
import { formatMmk } from '@/utils/format';

export function ServicesPage() {
  const { profile, refresh } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories, isLoading: catsLoading } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });

  const myServices = (profile?.services ?? []) as any[];

  // Bulk apply: pricing defaults for newly added services
  const [bulkPricingType, setBulkPricingType] = useState<'FIXED' | 'STARTING_FROM' | 'HOURLY' | 'QUOTE_REQUIRED'>('QUOTE_REQUIRED');
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');
  const [bulkMinutes, setBulkMinutes] = useState<number | ''>('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const upsertMut = useMutation({
    mutationFn: ({ serviceId, input }: { serviceId: string; input: any }) =>
      workerApi.upsertService({ serviceId, ...input }),
    onSuccess: () => { toast.success('Service saved'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => workerApi.removeService(id),
    onSuccess: () => { toast.success('Service removed'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });

  function addService(serviceId: string) {
    const baseInput: any = {
      pricingType: bulkPricingType,
      estimatedMinutes: bulkMinutes === '' ? undefined : Number(bulkMinutes),
    };
    if (bulkPrice !== '' && Number(bulkPrice) > 0) {
      if (bulkPricingType === 'FIXED') baseInput.fixedPrice = Number(bulkPrice);
      else if (bulkPricingType === 'HOURLY') baseInput.hourlyRate = Number(bulkPrice);
      else baseInput.startingPrice = Number(bulkPrice);
    }
    upsertMut.mutate({ serviceId, input: baseInput });
  }

  function addAllInCategory(services: { id: string }[]) {
    services.forEach((s) => addService(s.id));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl font-bold text-gray-900">My services</h1>
      <p className="text-sm text-gray-500 mt-1">
        You have {myServices.length} service{myServices.length === 1 ? '' : 's'} active.
        Set default pricing below, then add the services you offer.
      </p>

      {/* Bulk add panel */}
      <Card className="p-4 sm:p-5 mt-6 border-brand-200 bg-brand-50/50">
        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Default pricing for new services</h2>
        <p className="text-xs text-gray-500 mt-0.5">Set once. All services you add below will use these defaults. You can edit any service individually afterwards.</p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div>
            <label className="text-xs text-gray-500">Pricing type</label>
            <select
              value={bulkPricingType}
              onChange={(e) => setBulkPricingType(e.target.value as any)}
              className="mt-1 w-full px-2 py-2 border rounded-lg bg-white"
            >
              <option value="QUOTE_REQUIRED">Quote required</option>
              <option value="FIXED">Fixed price</option>
              <option value="STARTING_FROM">Starting from</option>
              <option value="HOURLY">Hourly</option>
            </select>
          </div>
          <Input
            label="Price (MMK)"
            type="number"
            placeholder="e.g. 15000"
            value={bulkPrice}
            onChange={(e) => {
              const v = e.target.value;
              setBulkPrice(v === '' ? '' : Number(v));
            }}
          />
          <Input
            label="Estimated minutes"
            type="number"
            placeholder="e.g. 60"
            value={bulkMinutes}
            onChange={(e) => {
              const v = e.target.value;
              setBulkMinutes(v === '' ? '' : Number(v));
            }}
          />
        </div>
      </Card>

      {/* Service list grouped by category */}
      <div className="mt-6 space-y-3">
        {catsLoading ? <Skeleton className="h-32" /> : !categories?.length ? (
          <EmptyState title="No services available" description="Categories have not been configured." />
        ) : (
          categories!.map((c) => {
            const isCollapsed = collapsed[c.id];
            const inCategory = c.services.map((s) => ({ id: s.id, name: s.name, mine: myServices.find((m) => m.serviceId === s.id) }));
            const addedCount = inCategory.filter((x) => x.mine).length;
            return (
              <Card key={c.id} className="overflow-hidden">
                <button
                  onClick={() => setCollapsed({ ...collapsed, [c.id]: !isCollapsed })}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        {addedCount} of {c.services.length} added
                      </div>
                    </div>
                  </div>
                  {!isCollapsed && addedCount < c.services.length && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); addAllInCategory(c.services); }}
                      disabled={upsertMut.isPending}
                    >
                      <Plus size={14} className="mr-1" /> Add all in {c.name}
                    </Button>
                  )}
                </button>
                {!isCollapsed && (
                  <div className="border-t divide-y">
                    {inCategory.map((s) => (
                      <ServiceRow
                        key={s.id}
                        serviceId={s.id}
                        name={s.name}
                        categoryName={c.name}
                        initial={s.mine}
                        onSave={(input) => upsertMut.mutate({ serviceId: s.id, input })}
                        onRemove={() => removeMut.mutate(s.id)}
                        saving={upsertMut.isPending && upsertMut.variables?.serviceId === s.id}
                      />
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function ServiceRow({ serviceId, name, categoryName, initial, onSave, onRemove, saving }: { serviceId: string; name: string; categoryName: string; initial: any; onSave: (input: any) => void; onRemove: () => void; saving: boolean }) {
  const [editing, setEditing] = useState(false);
  const [pricingType, setPricingType] = useState(initial?.pricingType ?? 'QUOTE_REQUIRED');
  const [startingPrice, setStartingPrice] = useState<number | ''>(initial?.startingPrice ?? '');
  const [hourlyRate, setHourlyRate] = useState<number | ''>(initial?.hourlyRate ?? '');
  const [fixedPrice, setFixedPrice] = useState<number | ''>(initial?.fixedPrice ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(initial?.estimatedMinutes ?? '');

  if (!initial) {
    return (
      <div className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50">
        <div>
          <div className="font-medium text-gray-900 text-sm">{name}</div>
          <div className="text-xs text-gray-500">{categoryName}</div>
        </div>
        <Button
          size="sm"
          onClick={() => onSave({
            pricingType,
            startingPrice: startingPrice === '' ? undefined : Number(startingPrice),
            hourlyRate: hourlyRate === '' ? undefined : Number(hourlyRate),
            fixedPrice: fixedPrice === '' ? undefined : Number(fixedPrice),
            estimatedMinutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
          })}
          disabled={saving}
        >
          {saving ? <Spinner size={14} /> : <><Plus size={14} className="mr-1" /> Add</>}
        </Button>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
            <Check size={14} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 text-sm truncate">{name}</div>
            <div className="text-xs text-gray-500">
              {initial.pricingType === 'QUOTE_REQUIRED' ? 'Quote required' : `${initial.pricingType.replace('_', ' ').toLowerCase()} · ${formatMmk(initial.startingPrice ?? initial.hourlyRate ?? initial.fixedPrice)}`}
              {initial.estimatedMinutes ? ` · ~${initial.estimatedMinutes} min` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={onRemove}><Trash2 size={14} /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div>
          <label className="text-xs text-gray-500">Pricing type</label>
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as any)} className="mt-1 w-full px-2 py-1.5 border rounded-lg bg-white">
            <option value="FIXED">Fixed</option>
            <option value="STARTING_FROM">Starting from</option>
            <option value="HOURLY">Hourly</option>
            <option value="QUOTE_REQUIRED">Quote required</option>
          </select>
        </div>
        {pricingType === 'FIXED' && <Input label="Fixed (MMK)" type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value as any)} />}
        {pricingType === 'STARTING_FROM' && <Input label="From (MMK)" type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value as any)} />}
        {pricingType === 'HOURLY' && <Input label="Hourly (MMK)" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value as any)} />}
        <Input label="Minutes" type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value as any)} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        <Button size="sm" disabled={saving} onClick={() => {
          onSave({
            pricingType,
            startingPrice: startingPrice === '' ? undefined : Number(startingPrice),
            hourlyRate: hourlyRate === '' ? undefined : Number(hourlyRate),
            fixedPrice: fixedPrice === '' ? undefined : Number(fixedPrice),
            estimatedMinutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
          });
          setEditing(false);
        }}>
          {saving ? <Spinner size={14} /> : 'Save'}
        </Button>
      </div>
    </div>
  );
}