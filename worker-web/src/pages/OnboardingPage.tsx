import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Check, ChevronRight, Wrench, Camera, Clock, MapPin, FileText, Banknote, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { categoryApi, fileApi, workerApi } from '@/api/endpoints';
import { Badge, Button, Card, Input, Spinner, Textarea } from '@/components/UI';
import { useI18n } from '@/i18n';

type Step = 'profile' | 'services' | 'availability' | 'kyc' | 'review';

export function OnboardingPage() {
  const { t } = useI18n();
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
    { key: 'profile',      label: t('onboarding.stepProfile'),     icon: Camera },
    { key: 'services',     label: t('onboarding.stepServices'),    icon: Banknote },
    { key: 'availability', label: t('onboarding.stepAvailability'), icon: Clock },
    { key: 'kyc',          label: t('onboarding.stepKyc'),          icon: FileText },
    { key: 'review',       label: t('onboarding.stepReview'),      icon: BadgeCheck },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('onboarding.welcome', { name: user.fullName.split(' ')[0] })} 👋</h1>
      <p className="text-sm text-gray-500 mt-1">{t('onboarding.subtitle')}</p>

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
        {step === 'availability' && <AvailabilityStep onNext={() => setStep('kyc')} onBack={() => setStep('services')} />}
        {step === 'kyc' && <KycStep onNext={() => setStep('review')} onBack={() => setStep('availability')} />}
        {step === 'review' && <ReviewStep onSubmitted={() => { queryClient.invalidateQueries({ queryKey: ['me'] }); navigate('/dashboard'); }} />}
      </div>
    </div>
  );
}

function ProfileStep({ onNext }: { onNext: () => void }) {
  const { t } = useI18n();
  const { user: _user, profile, refresh } = useAuth();
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
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); toast.success(t('profile.useLocation') + ' ✓'); },
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
      toast.success(t('onboarding.profileSaved'));
      onNext();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? t('errors.generic'));
    } finally { setLoading(false); }
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900">{t('onboarding.tellUsAboutYourself')}</h2>
      <p className="text-sm text-gray-500 mt-1">{t('onboarding.shownToCustomers')}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <Textarea label={t('profile.aboutMe')} rows={3} placeholder={t('onboarding.bioPlaceholder')} {...register('bio')} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label={t('dashboard.experience')} type="number" {...register('experienceYears')} />
          <Input label={t('dashboard.radius')} type="number" {...register('serviceRadiusKm')} />
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" {...register('emergencyAvailable')} />
            <span className="text-sm">{t('onboarding.emergencyService')}</span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('profile.coordinates')} type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value as any)} />
          <Input label={t('common.max')} type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value as any)} />
        </div>
        <Button type="button" variant="outline" onClick={detectLocation}><MapPin size={14} className="mr-2"/>{t('profile.useLocation')}</Button>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? <Spinner size={16} /> : t('onboarding.saveAndContinue')}</Button>
        </div>
      </form>
    </Card>
  );
}

function ServicesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t } = useI18n();
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const queryClient = useQueryClient();
  const { profile, refresh } = useAuth();
  const myServices = profile?.services ?? [];

  const upsertMut = useMutation({
    mutationFn: workerApi.upsertService,
    onSuccess: () => { toast.success(t('services.title')); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });
  const removeMut = useMutation({
    mutationFn: (serviceId: string) => workerApi.removeService(serviceId),
    onSuccess: () => { toast.success(t('common.remove')); queryClient.invalidateQueries({ queryKey: ['worker-profile'] }); refresh(); },
  });

  function getMyServiceFor(serviceId: string) {
    return myServices.find((s: any) => s.serviceId === serviceId);
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900">{t('onboarding.yourServicesAndPricing')}</h2>
      <p className="text-sm text-gray-500 mt-1">{t('onboarding.pickServicesHint')}</p>

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
        <Button variant="ghost" onClick={onBack}>{t('common.back')}</Button>
        <Button onClick={onNext} disabled={myServices.length === 0}>{t('onboarding.continue')}</Button>
      </div>
      {myServices.length === 0 && <p className="text-xs text-yellow-700 mt-2 text-right">{t('onboarding.addAtLeastOneService')}</p>}
    </Card>
  );
}

function ServiceRow({ serviceId, name, categoryName, initial, onSave, onRemove, saving }: { serviceId: string; name: string; categoryName: string; initial: any; onSave: (input: any) => void; onRemove: () => void; saving: boolean }) {
  const { t } = useI18n();
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
        {initial && <Badge color="green">{t('onboarding.added')}</Badge>}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div>
          <label className="text-xs text-gray-500">{t('onboarding.pricingType')}</label>
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as any)} className="mt-1 w-full px-2 py-1.5 border rounded-lg">
            <option value="FIXED">{t('onboarding.fixedPrice')}</option>
            <option value="STARTING_FROM">{t('onboarding.startingFrom')}</option>
            <option value="HOURLY">{t('onboarding.hourlyRate')}</option>
            <option value="QUOTE_REQUIRED">{t('onboarding.quoteRequired')}</option>
          </select>
        </div>
        {pricingType === 'FIXED' && (
          <Input label={t('onboarding.fixedPriceLabel')} type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value as any)} />
        )}
        {pricingType === 'STARTING_FROM' && (
          <Input label={t('onboarding.startingFromLabel')} type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value as any)} />
        )}
        {pricingType === 'HOURLY' && (
          <Input label={t('onboarding.hourlyRateLabel')} type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value as any)} />
        )}
        <Input label={t('onboarding.estimatedMinutes')} type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value as any)} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {initial && <Button variant="ghost" size="sm" onClick={onRemove}>{t('common.remove')}</Button>}
        <Button size="sm" disabled={saving} onClick={() => onSave({
          pricingType,
          startingPrice: startingPrice === '' ? undefined : Number(startingPrice),
          hourlyRate: hourlyRate === '' ? undefined : Number(hourlyRate),
          fixedPrice: fixedPrice === '' ? undefined : Number(fixedPrice),
          estimatedMinutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
        })}>
          {saving ? <Spinner size={14} /> : initial ? t('common.update') : t('common.add')}
        </Button>
      </div>
    </div>
  );
}

function AvailabilityStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t } = useI18n();
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
      toast.success(t('onboarding.availabilitySaved'));
      onNext();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? t('errors.generic'));
    } finally { setSaving(false); }
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900">{t('onboarding.whenAvailable')}</h2>
      <p className="text-sm text-gray-500 mt-1">{t('onboarding.setHoursHint')}</p>
      <div className="mt-4 space-y-2">
        {entries.map((e, i) => (
          <div key={e.day} className="flex items-center gap-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              checked={e.isAvailable}
              onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, isAvailable: ev.target.checked } : x))}
            />
            <div className="font-medium w-24">{t(`days.${e.day.toLowerCase()}`)}</div>
            <input
              type="time"
              disabled={!e.isAvailable}
              value={e.startTime}
              onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, startTime: ev.target.value } : x))}
              className="px-2 py-1.5 border rounded-lg disabled:opacity-50"
            />
            <span>{t('common.to')}</span>
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
        <Button variant="ghost" onClick={onBack}>{t('common.back')}</Button>
        <Button onClick={save} disabled={saving}>{saving ? <Spinner size={16} /> : t('onboarding.saveAndContinue')}</Button>
      </div>
    </Card>
  );
}

function ReviewStep({ onSubmitted }: { onSubmitted: () => void }) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const status = profile?.verificationStatus;

  return (
    <Card className="p-6 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
        <FileText size={28} />
      </div>
      <h2 className="mt-4 text-xl font-bold text-gray-900">{t('onboarding.submitForReview')}</h2>
      <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
        {t('onboarding.submitHint')}
      </p>
      <div className="mt-4">
        {status === 'PENDING' ? (
          <Badge color="yellow">{t('onboarding.reviewPending')}</Badge>
        ) : status === 'APPROVED' ? (
          <Badge color="green">{t('onboarding.approved')}</Badge>
        ) : status === 'REJECTED' ? (
          <Badge color="red">{t('onboarding.rejected')}</Badge>
        ) : null}
      </div>
      {status !== 'APPROVED' && (
        <p className="text-xs text-gray-500 mt-3">
          {t('onboarding.mvpNote')}
        </p>
      )}
      <div className="mt-6">
        <Button onClick={onSubmitted}>{t('onboarding.goToDashboard')}</Button>
      </div>
    </Card>
  );
}

function KycStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { t } = useI18n();
  const [documentNumber, setDocumentNumber] = useState('');
  const [files, setFiles] = useState<Record<string, File | null>>({ SELFIE: null, NATIONAL_ID_FRONT: null, NATIONAL_ID_BACK: null, PASSPORT: null });
  const [saving, setSaving] = useState(false);

  async function submit() {
    const selected = Object.entries(files).filter((entry): entry is [string, File] => entry[1] !== null);
    if (!selected.length) return;
    setSaving(true);
    try {
      for (const [type, file] of selected) {
        const uploaded = await fileApi.upload(file);
        await workerApi.submitKyc({ type, fileUrl: uploaded.url, fileName: file.name, documentNumber: documentNumber || undefined });
      }
      toast.success(t('onboarding.kycSubmitted'));
      onNext();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? error?.message ?? t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900">{t('onboarding.kycTitle')}</h2>
      <p className="text-sm text-gray-500 mt-1">{t('onboarding.kycHint')}</p>
      <div className="mt-4 space-y-4">
        <Input label={t('onboarding.documentNumber')} value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} />
        {[
          ['SELFIE', t('onboarding.selfie')],
          ['NATIONAL_ID_FRONT', t('onboarding.nrcFront')],
          ['NATIONAL_ID_BACK', t('onboarding.nrcBack')],
          ['PASSPORT', t('onboarding.passport')],
        ].map(([type, label]) => <Input key={type} type="file" accept="image/*,.pdf" label={label} onChange={(event) => setFiles((current) => ({ ...current, [type]: event.target.files?.[0] ?? null }))} />)}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>{t('common.back')}</Button>
        <Button onClick={submit} disabled={!Object.values(files).some(Boolean) || saving}>{saving ? <Spinner size={16} /> : t('onboarding.submitDocument')}</Button>
      </div>
    </Card>
  );
}