import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Input, Spinner } from '@/components/UI';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).optional().or(z.literal('')),
  password: z.string().min(8),
  city: z.string().min(1, 'Enter your city'),
  addressLine: z.string().min(1, 'Enter your address'),
  experienceYears: z.coerce.number().int().min(0).max(80),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required', path: ['email'] });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
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
      toast.success('Account created — complete your profile to start receiving jobs');
      navigate('/onboarding');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900">Join as a worker</h1>
        <p className="text-sm text-gray-500 mt-1">Create your account and start receiving jobs in your area</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full name" {...register('fullName')} error={errors.fullName?.message} />
            <Input label="Years of experience" type="number" {...register('experienceYears')} error={errors.experienceYears?.message} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" {...register('city')} error={errors.city?.message} />
            <Input label="Address" {...register('addressLine')} error={errors.addressLine?.message} />
          </div>
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={16} /> : 'Create account'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
          Already registered? <Link to="/login" className="text-brand-700 font-medium hover:underline">Log in</Link>
        </div>
      </Card>
    </div>
  );
}