import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Spinner } from '@/components/UI';
import { authApi } from '@/api/endpoints';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { zStringRequired } from '@/utils/zod-helpers';
import { useI18n } from '@/i18n';

const schema = z.object({
  identifier: zStringRequired('Enter your email or phone'),
  password: zStringRequired('Enter your password'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await login(values.identifier, values.password);
      toast.success(t('auth.welcomeBack') + '!');
      navigate(redirect);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  async function fillDemo() {
    setLoading(true);
    try {
      await login('customer@demo.com', 'Customer@123');
      toast.success(t('auth.welcomeBack') + '!');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('auth.loginSubtitle')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t('auth.emailOrPhone')}</label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                {...register('identifier')}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {errors.identifier && <p className="text-xs text-red-600 mt-1">{errors.identifier.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('auth.password')}</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-brand-700 hover:underline">{t('auth.forgotPassword')}?</Link>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size={16} /> : <>{t('nav.login')} <ArrowRight size={16} className="ml-1" /></>}
          </Button>
          <button type="button" onClick={fillDemo} className="text-xs text-brand-700 hover:underline self-start" disabled={loading}>
            {t('auth.useDemoCustomer')}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-brand-700 font-medium hover:underline">{t('nav.signup')}</Link>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400">
          {t('auth.lookingToOffer')}{' '}
          <a href="http://localhost:5174/register" className="text-brand-700 hover:underline">{t('auth.joinAsWorker')}</a>
        </div>
      </Card>
    </div>
  );
}