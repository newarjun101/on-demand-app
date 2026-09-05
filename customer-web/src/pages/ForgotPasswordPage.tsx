import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button, Card, Input, Spinner } from '@/components/UI';
import { authApi } from '@/api/endpoints';

const schema = z.object({
  identifier: z.string().min(3),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await authApi.forgotPassword(values.identifier);
      toast.success('If an account exists, you will receive reset instructions shortly.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
        <p className="text-sm text-gray-500 mt-1">We'll send you reset instructions.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input label="Email or phone" {...register('identifier')} error={errors.identifier?.message} />
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Send reset link'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">Log in</Link>
        </div>
      </Card>
    </div>
  );
}