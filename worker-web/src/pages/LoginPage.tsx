import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Spinner } from '@/components/UI';
import { Wrench, ArrowRight, Mail, Lock } from 'lucide-react';

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/dashboard';
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(v: FormValues) {
    setLoading(true);
    try {
      await login(v.identifier, v.password);
      toast.success('Welcome back!');
      navigate(redirect);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function fillDemo() {
    setLoading(true);
    try {
      await login('plumber@demo.com', 'Worker@123');
      toast.success('Welcome!');
      navigate('/dashboard');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <Wrench size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Worker Pro</h1>
            <p className="text-sm text-gray-500">Get jobs near you</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email or phone</label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input {...register('identifier')} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@example.com" />
            </div>
            {errors.identifier && <p className="text-xs text-red-600 mt-1">{errors.identifier.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="password" {...register('password')} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="••••••••" />
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={16} /> : <>Log in <ArrowRight size={16} className="ml-1" /></>}
          </Button>
          <button type="button" onClick={fillDemo} className="text-xs text-brand-700 hover:underline" disabled={loading}>
            Use demo worker account (plumber@demo.com)
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
          New here? <Link to="/register" className="text-brand-700 font-medium hover:underline">Create an account</Link>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400">
          Looking to hire a worker? <a href="http://localhost:5173" className="text-brand-700 hover:underline">Customer app</a>
        </div>
      </Card>
    </div>
  );
}