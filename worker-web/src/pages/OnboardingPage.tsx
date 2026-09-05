import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Check, ChevronRight, Wrench, Camera, Clock, MapPin, FileText, Banknote, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { categoryApi, workerApi } from '@/api/endpoints';
import { Badge, Button, Card, Input, Spinner, Textarea } from '@/components/UI';

type Step = 'profile' | 'services' | 'availability' | 'review';

export function OnboardingPage() {
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('profile');

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });

  useEffect(() => {
    if (profile?.verificationStatus === 'APPROVED') navigate('/dashboard');
  }, [profile, navigate]);

  if (!user) return null;

  const steps: Array<{ key: Step; label: string; icon: any }> = [
    { key: 'profile', label: 'Profile', icon: Camera },
    { key: 'services', label: 'Services & pricing', icon: Banknote },
    { key: 'availability', label: 'Availability', icon: Clock },
    { key: 'review', label: 'Submit for review', icon: BadgeCheck },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.fullName.split(' ')[0]} 👋</h1>
      <p className="text-sm text-gray-500 mt-1">Complete these steps to start receiving job requests.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {steps.map((s, i) => {
          const idx = steps.findIndex((x) => x.key === step);
          const done = i < idx;
          return (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                step === s.key ? 'bg-brand-600 text-white' : done ? 'bg-brand-50 text-brand-700' : 'bg-white border text-gray-600',
              )}
            >
              {done ? <Check size={14} /> : <s.icon size={14} />} {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {step === 'profile' && <ProfileStep onNext={() => setStep('services')} />}
        {step === 'services' && <ServicesStep onNext={() => setStep('availability')} onBack={() => setStep('profile')} />}
        {step === 'availability' && <AvailabilityStep onNext={() => setStep('review')} onBack={() => setStep('services')} />}
        {step === 'review' && <ReviewStep onSubmitted={() => { queryClient.invalidateQueries({ queryKey: ['me'] }); navigate('/dashboard'); }} />}
      </div>
    </div>
  );
}

function ProfileStep({ onNext }: { onNext: () => void }) {
  const { user, profile, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | ''>(profile?.latitude ?? '');
  const [lng, setLng] = useState<number | ''>(profile?.longitude ?? '');
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      bio: profile?.bio ?? '',
      experienceYears: profile?.experienceYears ?? 0,
      serviceRadiusKm: profile?.serviceRadiusKm ?? 10,
      emergencyAvailable: profile?.emergencyAvailable ?? false,
    },
  });

  function detectLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); toast.success('Location captured'); },
      (err) => toast.error(err.message),
    );
  }

  async function onSubmit(v: any) {
    setLoading(true);
    try {
      await workerApi.updateProfile({
        bio: v.bio,
        experienceYears: Number(v.experienceYears),
        serviceRadiusKm: Number(v.serviceRadiusKm),
        emergencyAvailable: Boolean(v.emergencyAvailable),
        latitude: lat === '' ? undefined : Number(lat),
        longitude: lng === '' ? undefined : Number(lng),
      });
      await refresh();
      toast.success('Profile saved');
      onNext();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Save failed');
    } finally { setLoading(false); }
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900">Tell us about yourself</h2>
      <p className="text-sm text-gray-500 mt-1">This information will be shown to customers.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <Textarea label="Bio" rows={3} placeholder="What services do you offer? Any special skills?" {...register('bio')} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Experience (years)" type="number" {...register('experienceYears')} />
          <Input label="Service radius (km)" type="number" {...register('serviceRadiusKm')} />
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" {...register('emergencyAvailable')} />
            <span className="text-sm">24/7 emergency service</span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Latitude" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value as any)} />
          <Input label="Longitude" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value as any)} />
        </div>
        <Button type="button" variant="outline" onClick={detectLocation}><MapPin size={14} className="mr-2"/>Detect my location</Button>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? <Spinner size={16} /> : 'Save & continue'}</Button>
        </div>
      </form>
    </Card>
  );
}

function ServicesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const queryClient = useQueryClient();
  const { profile, refresh } = useAuth();
  const myServices = profile?.services ?? [];

  const upsertMut = useMutation({
    mutationFn: workerApi.upsertService,
    onSuccess: () => { toast.success('Service saved'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });
  const removeMut = useMutation({
    mutationFn: (serviceId: string) => workerApi.removeService(serviceId),
    onSuccess: () => { toast.success('Service removed'); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });

  function getMyServiceFor(serviceId: string) {
    return myServices.find((s: any) => s.serviceId === serviceId);
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900">Your services and pricing</h2>
      <p className="text-sm text-gray-500 mt-1">Pick the services you offer and set your pricing.</p>

      <div className="mt-4 space-y-3">
        {(categories ?? []).flatMap((c) => c.services.map((s) => ({ ...s, categoryName: c.name }))).map((s) => {
          const mine = getMyServiceFor(s.id);
          return (
            <ServiceRow
              key={s.id}
              serviceId={s.id}
              name={s.name}
              categoryName={s.categoryName}
              initial={mine as any}
              onSave={(input) => upsertMut.mutate({ serviceId: s.id, ...input })}
              onRemove={() => removeMut.mutate(s.id)}
              saving={upsertMut.isPending}
            />
          );
        })}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={myServices.length === 0}>Continue</Button>
      </div>
      {myServices.length === 0 && <p className="text-xs text-yellow-700 mt-2 text-right">Add at least one service to continue.</p>}
    </Card>
  );
}

function ServiceRow({ serviceId, name, categoryName, initial, onSave, onRemove, saving }: { serviceId: string; name: string; categoryName: string; initial: any; onSave: (input: any) => void; onRemove: () => void; saving: boolean }) {
  const [pricingType, setPricingType] = useState(initial?.pricingType ?? 'STARTING_FROM');
  const [startingPrice, setStartingPrice] = useState<number | ''>(initial?.startingPrice ?? '');
  const [hourlyRate, setHourlyRate] = useState<number | ''>(initial?.hourlyRate ?? '');
  const [fixedPrice, setFixedPrice] = useState<number | ''>(initial?.fixedPrice ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(initial?.estimatedMinutes ?? '');

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{categoryName}</div>
        </div>
        {initial && <Badge color="green">Added</Badge>}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div>
          <label className="text-xs text-gray-500">Pricing type</label>
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as any)} className="mt-1 w-full px-2 py-1.5 border rounded-lg">
            <option value="FIXED">Fixed price</option>
            <option value="STARTING_FROM">Starting from</option>
            <option value="HOURLY">Hourly rate</option>
            <option value="QUOTE_REQUIRED">Quote required</option>
          </select>
        </div>
        {pricingType === 'FIXED' && (
          <Input label="Fixed price (MMK)" type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value as any)} />
        )}
        {pricingType === 'STARTING_FROM' && (
          <Input label="Starting from (MMK)" type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value as any)} />
        )}
        {pricingType === 'HOURLY' && (
          <Input label="Hourly rate (MMK)" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value as any)} />
        )}
        <Input label="Estimated minutes" type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value as any)} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {initial && <Button variant="ghost" size="sm" onClick={onRemove}>Remove</Button>}
        <Button size="sm" disabled={saving} onClick={() => onSave({
          pricingType,
          startingPrice: startingPrice === '' ? undefined : Number(startingPrice),
          hourlyRate: hourlyRate === '' ? undefined : Number(hourlyRate),
          fixedPrice: fixedPrice === '' ? undefined : Number(fixedPrice),
          estimatedMinutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
        })}>
          {saving ? <Spinner size={14} /> : initial ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

function AvailabilityStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { profile, refresh } = useAuth();
  const [entries, setEntries] = useState(() => {
    const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
    return days.map((d) => {
      const existing = (profile as any)?.availability?.find((a: any) => a.day === d);
      return { day: d, isAvailable: existing?.isAvailable ?? (d !== 'SUNDAY'), startTime: existing?.startTime ?? '08:00', endTime: existing?.endTime ?? '18:00' };
    });
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await workerApi.setAvailability(entries);
      await refresh();
      toast.success('Availability saved');
      onNext();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900">When are you available?</h2>
      <p className="text-sm text-gray-500 mt-1">Set working hours for each day.</p>
      <div className="mt-4 space-y-2">
        {entries.map((e, i) => (
          <div key={e.day} className="flex items-center gap-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              checked={e.isAvailable}
              onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, isAvailable: ev.target.checked } : x))}
            />
            <div className="font-medium w-24">{e.day.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</div>
            <input
              type="time"
              disabled={!e.isAvailable}
              value={e.startTime}
              onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, startTime: ev.target.value } : x))}
              className="px-2 py-1.5 border rounded-lg disabled:opacity-50"
            />
            <span>to</span>
            <input
              type="time"
              disabled={!e.isAvailable}
              value={e.endTime}
              onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, endTime: ev.target.value } : x))}
              className="px-2 py-1.5 border rounded-lg disabled:opacity-50"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={save} disabled={saving}>{saving ? <Spinner size={16} /> : 'Save & continue'}</Button>
      </div>
    </Card>
  );
}

function ReviewStep({ onSubmitted }: { onSubmitted: () => void }) {
  const { profile } = useAuth();
  const status = profile?.verificationStatus;

  return (
    <Card className="p-6 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
        <FileText size={28} />
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-900">Submit for review</h2>
      <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
        Once you submit, our team will review your profile. You'll be able to receive jobs as soon as you're approved.
      </p>
      <div className="mt-4">
        {status === 'PENDING' ? (
          <Badge color="yellow">Review pending</Badge>
        ) : status === 'APPROVED' ? (
          <Badge color="green">Approved</Badge>
        ) : status === 'REJECTED' ? (
          <Badge color="red">Rejected</Badge>
        ) : null}
      </div>
      {status !== 'APPROVED' && (
        <p className="text-xs text-gray-500 mt-3">
          In production, you'd upload ID / certificates here. For the MVP demo, workers are auto-approved by seeding.
        </p>
      )}
      <div className="mt-6">
        <Button onClick={onSubmitted}>Go to dashboard</Button>
      </div>
    </Card>
  );
}