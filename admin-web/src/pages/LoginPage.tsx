import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { useAdminAuth } from '@/contexts/AuthContext';
import { extractError } from '@/api/client';
import { Button, Card, Spinner } from '@/components/UI';

export function LoginPage() {
  const { t } = useI18n();
  const { login, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state: { redirectTo?: string } | null };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{ identifier: string; password: string }>({
    defaultValues: { identifier: 'admin@demo.com', password: 'Admin@123' },
  });

  // If user is already authenticated (e.g. refreshed and came back to /login),
  // bounce to the dashboard.
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  async function onSubmit(v: { identifier: string; password: string }) {
    setLoading(true);
    setError(null);
    try {
      await login(v.identifier, v.password);
      toast.success(t('auth.welcomeBack'));
      // Wait for React to flush the state update, then navigate.
      // The auth context is now populated; RequireAuth will let us through.
      setTimeout(() => {
        const dest = (location?.state as any)?.redirectTo || '/dashboard';
        navigate(dest, { replace: true });
      }, 0);
    } catch (e: any) {
      const msg = extractError(e) || t('errors.generic');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function useDemo() {
    setValue('identifier', 'admin@demo.com');
    setValue('password', 'Admin@123');
  }
  function clear() {
    setValue('identifier', '');
    setValue('password', '');
    setError(null);
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><Shield size={28} /></div>
            <div>
              <div className="text-2xl font-bold">Admin Portal</div>
              <div className="text-sm text-indigo-200">Local Services Marketplace</div>
            </div>
          </div>
          <div className="mt-16 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">Manage your platform with confidence</h1>
            <p className="mt-4 text-indigo-200 text-lg">KYC verification, role-based access control, audit trail, analytics, and more — all in one place.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><div className="text-2xl font-bold">5</div><div className="text-indigo-200">Languages</div></div>
          <div><div className="text-2xl font-bold">39</div><div className="text-indigo-200">Permissions</div></div>
          <div><div className="text-2xl font-bold">∞</div><div className="text-indigo-200">Audit trail</div></div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 text-white items-center justify-center mb-3"><Shield size={28} /></div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          </div>
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.loginTitle')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('auth.loginSubtitle')}</p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.emailOrUsername')}</label>
                <input {...register('identifier', { required: true })} type="text" autoFocus autoComplete="username" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
                <input {...register('password', { required: true })} type="password" autoComplete="current-password" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-50">
                {loading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" /><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg> : <><LogIn size={16} />{t('nav.login')} <ArrowRight size={16} /></>}
              </button>
            </form>
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={useDemo} className="text-indigo-600 hover:text-indigo-700 font-medium">⚡ {t('auth.useDemoCredentials')}</button>
                <button type="button" onClick={clear} className="text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
              </div>
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-1">
                <div className="font-medium text-gray-700">{t('auth.demoCredentials')}:</div>
                <div>👤 <code className="bg-white px-1.5 py-0.5 rounded">admin@demo.com</code></div>
                <div>🔑 <code className="bg-white px-1.5 py-0.5 rounded">Admin@123</code></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
