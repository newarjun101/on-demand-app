import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Input, Spinner } from '@/components/UI';
import { zStringRequired, zEmailRequired, zStringOptional } from '@/utils/zod-helpers';
import { useI18n } from '@/i18n';

const schema = z
  .object({
    fullName: zStringRequired('Enter your full name'),
    email: zEmailRequired.optional().or(z.literal('')),
    phone: zStringOptional,
    password: zStringRequired('Password must be at least 8 characters'),
    city: zStringRequired('Enter your city'),
    addressLine: zStringRequired('Enter your address'),
    experienceYears: z.preprocess(
      (v) => (v === '' || v == null ? 0 : Number(v)),
      z.number().int().min(0).max(80),
    ),
  })
  .refine((d) => d.email || d.phone, { message: 'Email or phone is required', path: ['email'] });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { t } = useI18n();
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(v: FormValues) {
    setLoading(true);
    try {
      await doRegister({
        fullName: v.fullName,
        email: v.email || undefined,
        phone: v.phone || undefined,
        password: v.password,
        city: v.city,
        addressLine: v.addressLine,
        experienceYears: v.experienceYears,
      });
      toast.success(t('auth.createAccount') + ' — ' + t('onboarding.reviewPendingHint'));
      navigate('/onboarding');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.joinAsWorker')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('home.heroSubtitle')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('auth.fullName')} {...register('fullName')} error={errors.fullName?.message} />
            <Input label={t('auth.experience')} type="number" {...register('experienceYears')} error={errors.experienceYears?.message} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('auth.email')} type="email" {...register('email')} error={errors.email?.message} />
            <Input label={t('auth.phone')} {...register('phone')} error={errors.phone?.message} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('auth.city')} {...register('city')} error={errors.city?.message} />
            <Input label={t('auth.address')} {...register('addressLine')} error={errors.addressLine?.message} />
          </div>
          <Input label={t('auth.password')} type="password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={16} /> : t('auth.createAccount')}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
          {t('auth.haveAccount')} <Link to="/login" className="text-brand-700 font-medium hover:underline">{t('nav.login')}</Link>
        </div>
      </Card>
    </div>
  );
}