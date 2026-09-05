import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MapPin, Upload, X } from 'lucide-react';
import { categoryApi, requestApi, workerApi, uploadApi } from '@/api/endpoints';
import { Button, Card, Input, Select, Spinner, Textarea } from '@/components/UI';
import { formatMmk } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  serviceId: z.string().uuid('Select a service'),
  description: z.string().min(10, 'Describe the job (at least 10 chars)'),
  city: z.string().min(1, 'Enter your city'),
  addressLine: z.string().min(1, 'Enter your address'),
  landmark: z.string().optional(),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  schedule: z.enum(['AS_SOON_AS_POSSIBLE', 'TODAY', 'TOMORROW', 'CUSTOM_DATE']),
  scheduledAt: z.string().optional(),
  minBudget: z.number().int().min(0).optional(),
  maxBudget: z.number().int().min(0).optional(),
}).refine((d) => d.schedule !== 'CUSTOM_DATE' || d.scheduledAt, {
  message: 'Pick a date',
  path: ['scheduledAt'],
});

type FormValues = z.infer<typeof schema>;

export function CreateRequestPage() {
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

  const { register, handleSubmit, formState: { errors }, setValue, watch: watchAll } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      schedule: 'AS_SOON_AS_POSSIBLE',
      city: user?.phone ? 'Yangon' : '',
      addressLine: '',
      latitude: 16.8409,
      longitude: 96.1735,
    },
  });

  const schedule = watchAll('schedule');
  const serviceId = watchAll('serviceId');

  useEffect(() => {
    if (worker && worker.services.length > 0) {
      setValue('serviceId', worker.services[0].service.id);
    }
  }, [worker, setValue]);

  function getMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude);
        setValue('longitude', pos.coords.longitude);
        toast.success('Location captured');
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
      toast.error('Upload failed');
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const created = await requestApi.create({
        ...values,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        photoUrls,
      });
      toast.success('Request created — workers are being notified');
      navigate(`/requests/${created.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Could not create request');
    } finally {
      setSubmitting(false);
    }
  }

  const allServices = (categories ?? []).flatMap((c) =>
    c.services.map((s) => ({ ...s, categoryName: c.name })),
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Create service request</h1>
      <p className="text-sm text-gray-500 mt-1">Tell us what you need and we'll match you with workers near you.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Service</label>
            <Select
              {...register('serviceId')}
              options={[{ value: '', label: 'Select a service' }, ...allServices.map((s) => ({ value: s.id, label: `${s.name}${s.categoryName ? ' · ' + s.categoryName : ''}` }))]}
            />
            {errors.serviceId && <p className="text-xs text-red-600 mt-1">{errors.serviceId.message}</p>}
          </div>
          <Textarea
            label="Describe the problem"
            placeholder="e.g. My water pump stopped working this morning..."
            rows={5}
            {...register('description')}
            error={errors.description?.message}
          />
          <div>
            <label className="text-sm font-medium text-gray-700">Photos (optional)</label>
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
          <h2 className="font-semibold text-gray-900">Location</h2>
          <Input label="City" {...register('city')} error={errors.city?.message} />
          <Input label="Address" {...register('addressLine')} error={errors.addressLine?.message} />
          <Input label="Landmark (optional)" {...register('landmark')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number" step="any" {...register('latitude', { valueAsNumber: true })} />
            <Input label="Longitude" type="number" step="any" {...register('longitude', { valueAsNumber: true })} />
          </div>
          <Button type="button" variant="outline" onClick={getMyLocation}>
            <MapPin size={16} className="mr-2" /> Use my current location
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Schedule</h2>
          <Select
            label="When do you need it?"
            options={[
              { value: 'AS_SOON_AS_POSSIBLE', label: 'As soon as possible' },
              { value: 'TODAY', label: 'Today' },
              { value: 'TOMORROW', label: 'Tomorrow' },
              { value: 'CUSTOM_DATE', label: 'Custom date' },
            ]}
            {...register('schedule')}
          />
          {schedule === 'CUSTOM_DATE' && (
            <Input label="Pick a date/time" type="datetime-local" {...register('scheduledAt')} error={errors.scheduledAt?.message} />
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Budget (optional)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min (MMK)" type="number" {...register('minBudget', { valueAsNumber: true })} />
            <Input label="Max (MMK)" type="number" {...register('maxBudget', { valueAsNumber: true })} />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : 'Submit request'}
          </Button>
        </div>
      </form>
    </div>
  );
}