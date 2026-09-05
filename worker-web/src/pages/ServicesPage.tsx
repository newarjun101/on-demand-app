import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { categoryApi, workerApi } from '@/api/endpoints';
import { Badge, Button, Card, EmptyState, Input, Skeleton, Spinner } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';
import { formatMmk } from '@/utils/format';

export function ServicesPage() {
  const { profile, refresh } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories, isLoading: catsLoading } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });

  const myServices = (profile?.services ?? []) as any[];
  const allServices = (categories ?? []).flatMap((c) => c.services.map((s) => ({ ...s, categoryName: c.name })));

  const upsertMut = useMutation({
    mutationFn: workerApi.upsertService,
    onSuccess: () => { toast.success('Service saved'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => workerApi.removeService(id),
    onSuccess: () => { toast.success('Service removed'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My services</h1>
      <p className="text-sm text-gray-500 mt-1">Add and price the services you offer</p>

      <div className="mt-6 space-y-3">
        {catsLoading ? <Skeleton className="h-32" /> : allServices.length === 0 ? (
          <EmptyState title="No services available" description="Categories have not been configured." />
        ) : allServices.map((s) => {
          const mine = myServices.find((m) => m.serviceId === s.id);
          return (
            <ServiceRow
              key={s.id}
              serviceId={s.id}
              name={s.name}
              categoryName={s.categoryName}
              initial={mine}
              onSave={(input) => upsertMut.mutate({ serviceId: s.id, ...input })}
              onRemove={() => removeMut.mutate(s.id)}
              saving={upsertMut.isPending}
            />
          );
        })}
      </div>
    </div>
  );
}

function ServiceRow({ serviceId, name, categoryName, initial, onSave, onRemove, saving }: { serviceId: string; name: string; categoryName: string; initial: any; onSave: (input: any) => void; onRemove: () => void; saving: boolean }) {
  const [pricingType, setPricingType] = useState(initial?.pricingType ?? 'STARTING_FROM');
  const [startingPrice, setStartingPrice] = useState<number | ''>(initial?.startingPrice ?? '');
  const [hourlyRate, setHourlyRate] = useState<number | ''>(initial?.hourlyRate ?? '');
  const [fixedPrice, setFixedPrice] = useState<number | ''>(initial?.fixedPrice ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(initial?.estimatedMinutes ?? '');

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{categoryName}</div>
        </div>
        {initial && <Badge color="green">Added · {formatMmk(initial.startingPrice ?? initial.hourlyRate ?? initial.fixedPrice)}</Badge>}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div>
          <label className="text-xs text-gray-500">Pricing type</label>
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as any)} className="mt-1 w-full px-2 py-1.5 border rounded-lg">
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
        {initial && <Button size="sm" variant="ghost" onClick={onRemove}><Trash2 size={14} className="mr-1" /> Remove</Button>}
        <Button size="sm" disabled={saving} onClick={() => onSave({
          pricingType,
          startingPrice: startingPrice === '' ? undefined : Number(startingPrice),
          hourlyRate: hourlyRate === '' ? undefined : Number(hourlyRate),
          fixedPrice: fixedPrice === '' ? undefined : Number(fixedPrice),
          estimatedMinutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
        })}>
          {saving ? <Spinner size={14} /> : initial ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>
  );
}