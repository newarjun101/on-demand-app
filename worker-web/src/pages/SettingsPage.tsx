import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { userApi } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Button, Card, Input, Spinner } from '@/components/UI';
import { zStringRequired } from '@/utils/zod-helpers';
import { useI18n } from '@/i18n';

const schema = z.object({
  currentPassword: zStringRequired('Enter your current password'),
  newPassword: zStringRequired('New password must be at least 8 characters'),
  confirm: zStringRequired('Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });
type FormValues = z.infer<typeof schema>;

export function SettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });
  async function onSubmit(v: FormValues) {
    setLoading(true);
    try {
      await userApi.changePassword(v.currentPassword, v.newPassword);
      toast.success(t('settings.changePassword') + ' ✓');
      reset();
    } catch (e: any) { toast.error(extractError(e) ?? t('errors.generic')); }
    finally { setLoading(false); }
  }
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.settings')}</h1>
      <Card className="mt-6 p-6">
        <h2 className="font-semibold">{t('settings.changePassword')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input label={t('auth.currentPassword')} type="password" {...register('currentPassword')} error={errors.currentPassword?.message} />
          <Input label={t('auth.newPassword')} type="password" {...register('newPassword')} error={errors.newPassword?.message} />
          <Input label={t('auth.confirmPassword')} type="password" {...register('confirm')} error={errors.confirm?.message} />
          <Button type="submit" disabled={loading}>{loading ? <Spinner size={16} /> : t('common.save')}</Button>
        </form>
      </Card>
    </div>
  );
}