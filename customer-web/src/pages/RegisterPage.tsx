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
  })
  .refine((d) => d.email || d.phone, {
    message: 'Email or phone is required',
    path: ['email'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { t } = useI18n();
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await doRegister({
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        password: values.password,
      });
      toast.success(t('auth.createAccount') + '!');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.createAccount')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('home.heroSubtitle')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t('auth.fullName')}</label>
            <input
              {...register('fullName')}
              className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Zaw Lin"
            />
            {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('auth.email')}</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('auth.phone')}</label>
            <input
              {...register('phone')}
              className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="+959123456789"
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('auth.password')}</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={t('validation.passwordTooShort')}
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size={16} /> : t('auth.createAccount')}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">{t('nav.login')}</Link>
        </div>
      </Card>
    </div>
  );
}