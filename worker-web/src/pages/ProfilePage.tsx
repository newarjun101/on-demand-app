import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, workerApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, Input, Spinner, Textarea } from '@/components/UI';
import { formatMmk } from '@/utils/format';

const schema = z.object({
  fullName: z.string().min(2),
  bio: z.string().max(2000).optional(),
  experienceYears: z.coerce.number().int().min(0).max(80),
  serviceRadiusKm: z.coerce.number().int().min(1).max(200),
  emergencyAvailable: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { user, profile, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      bio: (profile as any)?.bio ?? '',
      experienceYears: (profile as any)?.experienceYears ?? 0,
      serviceRadiusKm: (profile as any)?.serviceRadiusKm ?? 10,
      emergencyAvailable: (profile as any)?.emergencyAvailable ?? false,
    },
  });

  async function onSubmit(v: FormValues) {
    setLoading(true);
    try {
      await userApi.updateProfile({ fullName: v.fullName });
      await workerApi.updateProfile({
        bio: v.bio,
        experienceYears: Number(v.experienceYears),
        serviceRadiusKm: Number(v.serviceRadiusKm),
        emergencyAvailable: Boolean(v.emergencyAvailable),
      });
      await refresh();
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Update failed');
    } finally { setLoading(false); }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My profile</h1>

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.fullName} size={72} />
          <div>
            <div className="font-semibold text-lg">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email ?? user.phone}</div>
            <div className="text-xs text-gray-400 mt-1">
              Worker account · <Badge color={profile?.verificationStatus === 'APPROVED' ? 'green' : 'yellow'}>{profile?.verificationStatus ?? 'PENDING'}</Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input label="Full name" {...register('fullName')} error={errors.fullName?.message} />
          <Textarea label="Bio" rows={3} {...register('bio')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Experience (years)" type="number" {...register('experienceYears')} />
            <Input label="Service radius (km)" type="number" {...register('serviceRadiusKm')} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('emergencyAvailable')} />
            <span className="text-sm">Available 24/7 for emergencies</span>
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Save changes'}
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="font-semibold">Stats</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div><div className="text-gray-500">Rating</div><div className="font-semibold">{(profile?.ratingAverage ?? 0).toFixed(1)}</div></div>
          <div><div className="text-gray-500">Reviews</div><div className="font-semibold">{profile?.ratingCount ?? 0}</div></div>
          <div><div className="text-gray-500">Completed</div><div className="font-semibold">{profile?.completedJobs ?? 0}</div></div>
        </div>
      </Card>
    </div>
  );
}