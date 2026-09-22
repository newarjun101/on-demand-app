import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MapPin, Upload, X } from 'lucide-react';
import { categoryApi, requestApi, workerApi, uploadApi, eventApi } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Button, Card, Input, Select, Spinner, Textarea } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n';

export function CreateRequestPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workerId = searchParams.get('workerId');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const { data: worker } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => workerApi.get(workerId!),
    enabled: !!workerId,
  });

  // Build the schema with localized error messages. Recreated when the
  // active locale changes so messages stay in sync.
  const schema = useMemo(() => z.object({
    serviceId: z.string({ required_error: t('request.selectServicePlaceholder') }).min(1, t('validation.selectService')).uuid(t('validation.invalid')),
    description: z.string().min(10, t('validation.describeJob')),
    city: z.string().min(1, t('validation.enterCity')),
    addressLine: z.string().min(1, t('validation.enterAddress')),
    landmark: z.string().optional(),
    latitude: z.preprocess(
      (v) => (v === '' || v == null ? 0 : Number(v)),
      z.number({ invalid_type_error: t('validation.invalidNumber') }).gte(-90, t('validation.invalidLatitude')).lte(90, t('validation.invalidLatitude')),
    ),
    longitude: z.preprocess(
      (v) => (v === '' || v == null ? 0 : Number(v)),
      z.number({ invalid_type_error: t('validation.invalidNumber') }).gte(-180, t('validation.invalidLongitude')).lte(180, t('validation.invalidLongitude')),
    ),
    schedule: z.enum(['AS_SOON_AS_POSSIBLE', 'TODAY', 'TOMORROW', 'CUSTOM_DATE']),
    scheduledAt: z.string().optional(),
    minBudget: z.preprocess(
      (v) => (v === '' || v == null ? undefined : Number(v)),
      z.number().int().min(0).optional(),
    ),
    maxBudget: z.preprocess(
      (v) => (v === '' || v == null ? undefined : Number(v)),
      z.number().int().min(0).optional(),
    ),
  }).refine(
    (d) => d.schedule !== 'CUSTOM_DATE' || (typeof d.scheduledAt === 'string' && d.scheduledAt.length > 0),
    { message: t('validation.pickDate'), path: ['scheduledAt'] },
  ).refine(
    (d) => d.minBudget == null || d.maxBudget == null || d.minBudget <= d.maxBudget,
    { message: t('validation.minBudget'), path: ['minBudget'] },
  ), [t]);

  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors }, setValue, watch, control, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: '',
      description: '',
      city: user?.phone ? 'Yangon' : '',
      addressLine: '',
      landmark: '',
      latitude: 16.8409,
      longitude: 96.1735,
      schedule: 'AS_SOON_AS_POSSIBLE',
      minBudget: undefined as any,
      maxBudget: undefined as any,
    },
    mode: 'onSubmit',
  });

  const schedule = watch('schedule');
  const serviceId = watch('serviceId');

  useEffect(() => {
    if (worker && worker.services.length > 0 && !serviceId) {
      setValue('serviceId', worker.services[0].service.id, { shouldValidate: true });
    }
  }, [worker, setValue, serviceId]);

  function getMyLocation() {
    if (!navigator.geolocation) {
      toast.error(t('errors.generic'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude, { shouldValidate: true });
        setValue('longitude', pos.coords.longitude, { shouldValidate: true });
        toast.success(t('request.location') + ' OK');
      },
      (err) => toast.error(err.message),
    );
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await uploadApi.upload(fd);
        setPhotoUrls((prev) => [...prev, res.url]);
      }
    } catch (err: any) {
      toast.error(t('errors.generic'));
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const created = await requestApi.create({
        ...values,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        photoUrls,
      } as any);
      toast.success(t('request.created'));
      eventApi.log({ type: 'book', serviceSlug: (created as any).service?.slug, categorySlug: (created as any).service?.category?.slug, city: (created as any).city }).catch(() => {});
      navigate(`/requests/${created.id}`);
    } catch (err: any) {
      const details = err?.response?.data?.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        const first = details[0];
        const path = Array.isArray(first.path) ? first.path.join('.') : 'value';
        toast.error(`${path}: ${first.message}`);
      } else {
        toast.error(extractError(err) || t('errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const onInvalid = (errs: any) => {
    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      const msg = errs[firstKey]?.message ?? t('errors.validationFailed');
      toast.error(`${firstKey}: ${msg}`);
    } else {
      toast.error(t('errors.validationFailed'));
    }
  };

  const allServices = (categories ?? []).flatMap((c) =>
    c.services.map((s) => ({ ...s, categoryName: c.name })),
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('request.createTitle')}</h1>
      <p className="text-sm text-gray-500 mt-1">{t('request.createSubtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-6">
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t('request.service')}</label>
            <Controller
              name="serviceId"
              control={control}
              render={({ field }) => (
                <Select
                  options={[{ value: '', label: t('request.selectServicePlaceholder') }, ...allServices.map((s) => ({ value: s.id, label: `${s.name}${s.categoryName ? ' · ' + s.categoryName : ''}` }))]}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
            {errors.serviceId && <p className="text-xs text-red-600 mt-1">{errors.serviceId.message}</p>}
          </div>
          <Textarea
            label={t('request.describeProblem')}
            placeholder={t('request.describePlaceholder')}
            rows={5}
            {...register('description')}
            error={errors.description?.message}
          />
          <div>
            <label className="text-sm font-medium text-gray-700">{t('request.photos')}</label>
            <div className="mt-1 flex flex-wrap gap-2 items-center">
              {photoUrls.map((u, i) => (
                <div key={i} className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden">
                  <img src={u} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-100">
                <input type="file" multiple accept="image/*" hidden onChange={uploadPhoto} />
                <Upload size={20} className="text-gray-400" />
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('request.location')}</h2>
          <Input label={t('auth.city')} {...register('city')} error={errors.city?.message} />
          <Input label={t('auth.address')} {...register('addressLine')} error={errors.addressLine?.message} />
          <Input label={t('auth.landmark')} {...register('landmark')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('profile.coordinates')} type="number" step="any" {...register('latitude', { valueAsNumber: true })} error={errors.latitude?.message} />
            <Input label={t('common.max')} type="number" step="any" {...register('longitude', { valueAsNumber: true })} error={errors.longitude?.message} />
          </div>
          <Button type="button" variant="outline" onClick={getMyLocation}>
            <MapPin size={16} className="mr-2" /> {t('profile.useLocation')}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('request.schedule')}</h2>
          <Select
            label={t('request.whenNeeded')}
            options={[
              { value: 'AS_SOON_AS_POSSIBLE', label: t('request.asap') },
              { value: 'TODAY', label: t('request.today') },
              { value: 'TOMORROW', label: t('request.tomorrow') },
              { value: 'CUSTOM_DATE', label: t('request.customDate') },
            ]}
            {...register('schedule')}
            error={errors.schedule?.message}
          />
          {schedule === 'CUSTOM_DATE' && (
            <Input label={t('request.pickDateTime')} type="datetime-local" {...register('scheduledAt')} error={errors.scheduledAt?.message} />
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('request.budget')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('request.minMmk')} type="number" min="0" step="any" {...register('minBudget', { valueAsNumber: true })} error={errors.minBudget?.message} />
            <Input label={t('request.maxMmk')} type="number" min="0" step="any" {...register('maxBudget', { valueAsNumber: true })} error={errors.maxBudget?.message} />
          </div>
        </Card>

        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <div className="font-medium">{t('request.pleaseFixErrors')}:</div>
            <ul className="mt-1 list-disc list-inside text-xs">
              {Object.entries(errors).slice(0, 5).map(([k, v]: any) => (
                <li key={k}>{k}: {v?.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : t('request.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}