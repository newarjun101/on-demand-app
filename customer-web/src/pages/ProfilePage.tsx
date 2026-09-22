import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Avatar, Button, Card, Input, Spinner } from '@/components/UI';
import { zStringRequired, zEmailRequired, zStringOptional } from '@/utils/zod-helpers';
import { useI18n } from '@/i18n';

const schema = z.object({
  fullName: zStringRequired('Enter your full name'),
  email: zEmailRequired.optional().or(z.literal('')),
  phone: zStringOptional,
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await userApi.updateProfile(values);
      await refreshUser();
      toast.success(t('profile.title'));
    } catch (e: any) {
      toast.error(extractError(e) ?? t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>
      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.fullName} size={72} />
          <div>
            <div className="font-semibold text-lg">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email ?? user.phone}</div>
            <div className="text-xs text-gray-400 mt-1">{t('auth.customerAccount')}</div>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input label={t('auth.fullName')} {...register('fullName')} error={errors.fullName?.message} />
          <Input label={t('auth.email')} {...register('email')} error={errors.email?.message} />
          <Input label={t('auth.phone')} {...register('phone')} error={errors.phone?.message} />
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size={16} /> : t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  );
}