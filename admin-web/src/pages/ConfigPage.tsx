import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { adminApi } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Button, Card, EmptyState, Input, Skeleton } from '@/components/UI';
import { Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ConfigPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-config-page'], queryFn: () => adminApi.getConfig() });
  const [form, setForm] = useState<any>(null);
  if (data && !form) setForm(data);
  const saveMut = useMutation({
    mutationFn: (body: any) => adminApi.updateConfig(body),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['admin-config-page'] }); },
    onError: (e) => toast.error(extractError(e)),
  });
  if (isLoading || !form) return <Skeleton className="h-64" />;
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('config.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('config.subtitle')}</p>
      </div>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">{t('config.branding')}</h2>
        <Input label={t('config.siteName')} value={form.siteName || ''} onChange={(e) => set('siteName', e.target.value)} />
        <Input label={t('config.supportEmail')} value={form.supportEmail || ''} onChange={(e) => set('supportEmail', e.target.value)} />
        <Input label={t('config.supportPhone')} value={form.supportPhone || ''} onChange={(e) => set('supportPhone', e.target.value)} />
      </Card>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">{t('config.commerce')}</h2>
        <Input label={t('config.commission')} type="number" value={form.commissionPercent ?? 10} onChange={(e) => set('commissionPercent', Number(e.target.value))} />
        <Input label={t('config.currency')} value={form.defaultCurrency || 'MMK'} onChange={(e) => set('defaultCurrency', e.target.value)} />
      </Card>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">{t('config.limits')}</h2>
        <Input label={t('config.maxUploadMb')} type="number" value={form.maxUploadMb ?? 8} onChange={(e) => set('maxUploadMb', Number(e.target.value))} />
        <Input label={t('config.maxRequestPhotoCount')} type="number" value={form.maxRequestPhotoCount ?? 5} onChange={(e) => set('maxRequestPhotoCount', Number(e.target.value))} />
      </Card>
      <div className="flex justify-end">
        <Button onClick={() => saveMut.mutate(form)} loading={saveMut.isPending}><SettingsIcon size={14} className="mr-1" />{t('common.save')}</Button>
      </div>
    </div>
  );
}
