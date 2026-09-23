import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, BoostTier } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { useI18n } from '@/i18n';
import { Button, Card, EmptyState, Input, Skeleton } from '@/components/UI';

const newTier = (): BoostTier => ({ id: `tier_${Date.now()}`, label: 'New tier', days: 1, amount: 1000, boostFactor: 1 });

export function BoostTiersPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-boost-pricing'], queryFn: adminApi.getPricing });
  const [tiers, setTiers] = useState<BoostTier[]>([]);
  useEffect(() => { if (data) setTiers(data.boostTiers); }, [data]);
  const save = useMutation({
    mutationFn: () => adminApi.updatePricing({ boostTiers: tiers }),
    onSuccess: () => { toast.success(t('common.save')); qc.invalidateQueries({ queryKey: ['admin-boost-pricing'] }); },
    onError: (error: any) => toast.error(extractError(error)),
  });
  const update = (index: number, patch: Partial<BoostTier>) => setTiers((current) => current.map((tier, i) => i === index ? { ...tier, ...patch } : tier));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('boost.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('boost.subtitle')}</p>
      </div>
      {isLoading ? <Skeleton className="h-48" /> : tiers.length === 0 ? <EmptyState title="No boost tiers" /> : <div className="space-y-3">{tiers.map((tier, index) => <Card key={tier.id} className="p-4"><div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"><Input label="Label" value={tier.label} onChange={(event) => update(index, { label: event.target.value })} /><Input label="Days" type="number" min="1" value={tier.days} onChange={(event) => update(index, { days: Number(event.target.value) })} /><Input label="Price (MMK)" type="number" min="1000" value={tier.amount} onChange={(event) => update(index, { amount: Number(event.target.value) })} /><Input label="Boost factor" type="number" min="1" step="0.1" value={tier.boostFactor} onChange={(event) => update(index, { boostFactor: Number(event.target.value) })} /><Button variant="ghost" className="text-red-600" disabled={tiers.length === 1} onClick={() => setTiers((current) => current.filter((_, i) => i !== index))}><Trash2 size={16} /> Remove</Button></div></Card>)}</div>}
      <div className="flex justify-between"><Button variant="outline" onClick={() => setTiers((current) => [...current, newTier()])}><Plus size={16} className="mr-1" /> Add tier</Button><Button disabled={tiers.length === 0 || save.isPending} loading={save.isPending} onClick={() => save.mutate()}><Zap size={16} className="mr-1" /> Save boost tiers</Button></div>
    </div>
  );
}
