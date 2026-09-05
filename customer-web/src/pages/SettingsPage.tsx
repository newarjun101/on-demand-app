import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Card, Input, Button, Spinner } from '@/components/UI';
import { userApi } from '@/api/endpoints';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

type FormValues = z.infer<typeof schema>;

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await userApi.changePassword(values.currentPassword, values.newPassword);
      toast.success('Password changed');
      reset();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <Card className="mt-6 p-6">
        <h2 className="font-semibold text-gray-900">Change password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input label="Current password" type="password" {...register('currentPassword')} error={errors.currentPassword?.message} />
          <Input label="New password" type="password" {...register('newPassword')} error={errors.newPassword?.message} />
          <Input label="Confirm new password" type="password" {...register('confirm')} error={errors.confirm?.message} />
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}