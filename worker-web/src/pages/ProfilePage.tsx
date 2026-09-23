import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Camera, Edit, MapPin, Plus, Save, Trash2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fileApi, userApi, workerApi } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Avatar, Badge, Button, Card, Input, Spinner, Textarea } from '@/components/UI';
import { formatMmk, resolveImageUrl } from '@/utils/format';
import { zStringRequired, zStringOptional, zNumberOptional } from '@/utils/zod-helpers';

const schema = z.object({
  fullName: zStringRequired('Name is too short'),
  bio: zStringOptional,
  city: zStringOptional,
  addressLine: zStringOptional,
  latitude: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().gte(-90).lte(90).optional(),
  ),
  longitude: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().gte(-180).lte(180).optional(),
  ),
  experienceYears: z.preprocess(
    (v) => (v === '' || v == null ? 0 : Number(v)),
    z.number().int().min(0).max(80),
  ),
  serviceRadiusKm: z.preprocess(
    (v) => (v === '' || v == null ? 10 : Number(v)),
    z.number().int().min(1).max(200),
  ),
  emergencyAvailable: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

async function uploadFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image');
  if (file.size > 8 * 1024 * 1024) throw new Error('Image must be smaller than 8 MB');
  const { url } = await fileApi.upload(file);
  return url;
}

export function ProfilePage() {
  const { user, profile, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const { data: portfolio, refetch: refetchPortfolio } = useQuery({
    queryKey: ['my-portfolio', user?.id],
    queryFn: async () => {
      const me = await workerApi.myProfile();
      return (me?.portfolio ?? []) as Array<{ id: string; imageUrl: string; caption: string | null }>;
    },
    enabled: !!user,
  });

  const defaultValues: FormValues = {
    fullName: user?.fullName ?? '',
    bio: (profile as any)?.bio ?? '',
    city: (profile as any)?.city ?? '',
    addressLine: (profile as any)?.addressLine ?? '',
    latitude: (profile as any)?.latitude ?? ('' as any),
    longitude: (profile as any)?.longitude ?? ('' as any),
    experienceYears: (profile as any)?.experienceYears ?? 0,
    serviceRadiusKm: (profile as any)?.serviceRadiusKm ?? 10,
    emergencyAvailable: (profile as any)?.emergencyAvailable ?? false,
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // When entering edit mode, refresh defaults from current profile
  useEffect(() => {
    if (editing) reset(defaultValues);
  }, [editing]);

  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude as any);
        setValue('longitude', pos.coords.longitude as any);
        toast.success('Location captured');
      },
      (err) => toast.error(err.message || 'Could not detect location'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(v: FormValues) {
    setSaving(true);
    try {
      await userApi.updateProfile({ fullName: v.fullName });
      await workerApi.updateProfile({
        bio: v.bio || undefined,
        city: v.city || undefined,
        addressLine: v.addressLine || undefined,
        latitude: v.latitude,
        longitude: v.longitude,
        experienceYears: Number(v.experienceYears),
        serviceRadiusKm: Number(v.serviceRadiusKm),
        emergencyAvailable: Boolean(v.emergencyAvailable),
      });
      await refresh();
      toast.success('Profile updated');
      setEditing(false);
    } catch (e: any) {
      toast.error(extractError(e) ?? 'Update failed');
    } finally { setSaving(false); }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const url = await uploadFile(file);
      await userApi.updateProfile({ avatarUrl: url });
      await refresh();
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function onPortfolioAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingPortfolio(true);
    try {
      for (const file of files) {
        const url = await uploadFile(file);
        await workerApi.addPortfolioImage(url, file.name);
      }
      await refetchPortfolio();
      await refresh();
      toast.success(`Added ${files.length} image${files.length > 1 ? 's' : ''}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed');
    } finally {
      setUploadingPortfolio(false);
      if (portfolioInputRef.current) portfolioInputRef.current.value = '';
    }
  }

  async function removePortfolio(id: string) {
    if (!confirm('Remove this image?')) return;
    try {
      await workerApi.removePortfolioImage(id);
      await refetchPortfolio();
      await refresh();
      toast.success('Image removed');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not remove');
    }
  }

  function cancelEdit() {
    reset(defaultValues);
    setEditing(false);
  }

  if (!user) return null;
  const currentAvatar = avatarPreview ?? user.avatarUrl;
  const portfolioItems = portfolio ?? [];
  const lat = watch('latitude');
  const lng = watch('longitude');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            {editing ? 'Editing your profile' : 'How customers see you'}
          </p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)}>
            <Edit size={16} className="mr-2" /> Edit profile
          </Button>
        )}
      </div>

      {/* Avatar + status */}
      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar src={currentAvatar} name={user.fullName} size={72} />
            {editing && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center text-white opacity-0 group-hover:opacity-100"
                  aria-label="Change profile photo"
                >
                  {uploadingAvatar ? <Spinner size={20} /> : <Camera size={20} />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onAvatarChange}
                />
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email ?? user.phone}</div>
            <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
              Worker account ·
              <Badge color={profile?.verificationStatus === 'APPROVED' ? 'green' : 'yellow'}>
                {profile?.verificationStatus ?? 'PENDING'}
              </Badge>
            </div>
            {editing && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-2 text-xs text-brand-700 hover:underline disabled:opacity-50"
              >
                {uploadingAvatar ? 'Uploading…' : 'Change profile photo'}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Read-only summary OR edit form */}
      {!editing ? (
        <>
          <Card className="mt-4 p-6 space-y-4">
            <div>
              <h2 className="font-semibold">About me</h2>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{(profile as any)?.bio || <span className="text-gray-400 italic">No bio yet. Click Edit profile to add one.</span>}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="City" value={(profile as any)?.city || '—'} />
              <InfoRow label="Address" value={(profile as any)?.addressLine || '—'} />
              <InfoRow label="Service radius" value={`${(profile as any)?.serviceRadiusKm ?? 10} km`} />
              <InfoRow label="Experience" value={`${(profile as any)?.experienceYears ?? 0} years`} />
              <InfoRow label="Emergency" value={(profile as any)?.emergencyAvailable ? 'Available 24/7' : 'By schedule'} />
              <InfoRow label="Coordinates" value={(profile as any)?.latitude ? `${((profile as any).latitude).toFixed(4)}, ${((profile as any).longitude).toFixed(4)}` : '—'} />
            </div>
          </Card>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">About me</h2>
            <Input label="Full name" {...register('fullName')} error={errors.fullName?.message} />
            <Textarea label="Bio" rows={4} placeholder="Tell customers about your experience, skills and service style..." {...register('bio')} error={errors.bio?.message} />
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><MapPin size={16} /> Location &amp; service area</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="City" placeholder="Yangon" {...register('city')} error={errors.city?.message} />
              <Input label="Service radius (km)" type="number" {...register('serviceRadiusKm')} error={errors.serviceRadiusKm?.message} />
            </div>
            <Input label="Address" placeholder="No. 12, Ahlone Road" {...register('addressLine')} error={errors.addressLine?.message} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude" type="number" step="any" placeholder="16.8409" value={lat ?? ''} onChange={(e) => setValue('latitude', e.target.value as any)} />
              <Input label="Longitude" type="number" step="any" placeholder="96.1735" value={lng ?? ''} onChange={(e) => setValue('longitude', e.target.value as any)} />
            </div>
            <Button type="button" variant="outline" onClick={detectLocation}>
              <MapPin size={14} className="mr-2" /> Detect my current location
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Work preferences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Years of experience" type="number" {...register('experienceYears')} error={errors.experienceYears?.message} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('emergencyAvailable')} />
              <span className="text-sm">Available 24/7 for emergencies</span>
            </label>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
              <X size={16} className="mr-1" /> Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={16} /> : <><Save size={16} className="mr-1" /> Save changes</>}
            </Button>
          </div>
        </form>
      )}

      {/* Portfolio (always editable inline) */}
      <Card className="mt-4 p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-semibold">Portfolio</h2>
            <p className="text-xs text-gray-500 mt-0.5">Photos of your past work. Customers see these on your profile.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => portfolioInputRef.current?.click()}
            disabled={uploadingPortfolio}
          >
            {uploadingPortfolio ? <Spinner size={14} /> : <><Plus size={14} className="mr-1" /> Add photos</>}
          </Button>
          <input
            ref={portfolioInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={onPortfolioAdd}
          />
        </div>
        {portfolioItems.length === 0 ? (
          <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
            No photos yet. Click <strong>Add photos</strong> to upload pictures of your work.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {portfolioItems.map((img) => {
              const url = resolveImageUrl(img.imageUrl);
              return (
                <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {url && <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
                  <button
                    type="button"
                    onClick={() => removePortfolio(img.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="font-medium text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}