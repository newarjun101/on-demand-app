import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ExternalLink, FileText, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, KycDocument } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { useI18n } from '@/i18n';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Textarea } from '@/components/UI';
import { formatDate } from '@/utils/format';

const statusColor = (status: string) => (
  status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : status === 'PENDING' ? 'yellow' : 'gray'
) as 'green' | 'red' | 'yellow' | 'gray';

export function KycDetailPage() {
  const { workerProfileId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [review, setReview] = useState<{ doc: KycDocument; action: 'APPROVE' | 'REJECT'; reason: string; adminNotes: string } | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-worker-kyc-details', workerProfileId],
    queryFn: () => adminApi.workerKycDetails(workerProfileId!),
    enabled: Boolean(workerProfileId),
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { action: string; reason?: string; adminNotes?: string } }) => adminApi.reviewKyc(id, body),
    onSuccess: () => {
      toast.success(t('common.save'));
      qc.invalidateQueries({ queryKey: ['admin-worker-kyc-details', workerProfileId] });
      qc.invalidateQueries({ queryKey: ['admin-kyc'] });
      setReview(null);
    },
    onError: (error: any) => toast.error(extractError(error)),
  });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div>;
  if (isError || !data) return <EmptyState title={t('errors.notFound')} action={<Button onClick={() => navigate('/kyc')}>{t('common.back')}</Button>} />;

  const apiBase = (import.meta.env.VITE_API_URL as string)?.replace(/\/api$/, '') || 'http://localhost:4000';
  const { user } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Button variant="ghost" onClick={() => navigate('/kyc')} aria-label={t('common.back')}><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('kyc.details')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('kyc.subtitle')}</p>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <Avatar src={user.avatarUrl} name={user.fullName} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap"><h2 className="text-lg font-semibold">{user.fullName}</h2><Badge color={statusColor(data.verificationStatus)}>{data.verificationStatus}</Badge></div>
            <div className="text-sm text-gray-600 mt-1">{user.email || '—'} · {user.phone || '—'}</div>
            <div className="text-sm text-gray-600 mt-2 flex items-center gap-1"><MapPin size={15} /> {[data.addressLine, data.city].filter(Boolean).join(', ') || '—'}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div><div className="font-semibold">{data.experienceYears}</div><div className="text-gray-500">{t('kyc.experience')}</div></div>
            <div><div className="font-semibold">{data.completedJobs}</div><div className="text-gray-500">{t('workers.jobs')}</div></div>
            <div><div className="font-semibold">★ {data.ratingAverage.toFixed(1)}</div><div className="text-gray-500">{t('workers.rating')}</div></div>
          </div>
        </div>
        {data.bio && <p className="mt-4 pt-4 border-t text-sm text-gray-700 whitespace-pre-wrap">{data.bio}</p>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5"><h2 className="font-semibold">{t('kyc.services')}</h2>{data.services.length ? <div className="mt-3 space-y-2">{data.services.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.service.name} <span className="text-gray-500">· {item.service.category.name}</span></span><Badge color="indigo">{item.pricingType}</Badge></div>)}</div> : <p className="mt-3 text-sm text-gray-500">—</p>}</Card>
        <Card className="p-5"><h2 className="font-semibold">{t('kyc.availability')}</h2>{data.availability.length ? <div className="mt-3 space-y-2">{data.availability.map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.day}</span><span className="text-gray-600">{item.isAvailable ? `${item.startTime || '—'} – ${item.endTime || '—'}` : '—'}</span></div>)}</div> : <p className="mt-3 text-sm text-gray-500">—</p>}</Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t('kyc.documents')}</h2>
        {data.kycDocuments.length === 0 ? <div className="mt-3"><EmptyState title={t('kyc.noDocuments')} /></div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
          {data.kycDocuments.map((doc) => {
            const previewable = /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName || doc.fileUrl);
            return <Card key={doc.id} className="p-4">
              <div className="flex justify-between gap-2"><Badge color="indigo">{doc.type}</Badge><Badge color={statusColor(doc.status)}>{doc.status}</Badge></div>
              {previewable ? <img src={`${apiBase}${doc.fileUrl}`} alt={doc.type} className="mt-3 w-full aspect-video object-contain rounded bg-gray-100" /> : <div className="mt-3 h-36 rounded bg-gray-100 flex items-center justify-center"><FileText size={36} className="text-gray-400" /></div>}
              <div className="mt-3 text-sm font-medium truncate">{doc.fileName}</div>
              <div className="mt-1 text-xs text-gray-500">{t('kyc.uploaded')}: {formatDate(doc.createdAt)}</div>
              {doc.documentNumber && <div className="mt-2 text-xs text-gray-600">{t('kyc.documentNumber')}: {doc.documentNumber}</div>}
              {doc.workerNotes && <div className="mt-2 text-xs text-gray-600"><span className="font-medium">{t('kyc.workerNotes')}:</span> {doc.workerNotes}</div>}
              {doc.adminNotes && <div className="mt-2 text-xs text-gray-600"><span className="font-medium">{t('kyc.adminNotes')}:</span> {doc.adminNotes}</div>}
              {doc.rejectionReason && <div className="mt-2 text-xs text-red-600"><span className="font-medium">{t('kyc.rejectionReason')}:</span> {doc.rejectionReason}</div>}
              <div className="mt-4 pt-3 border-t flex items-center gap-2"><a href={`${apiBase}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 inline-flex items-center gap-1">{t('kyc.viewDocument')} <ExternalLink size={12} /></a><div className="ml-auto flex gap-1"><Button size="sm" onClick={() => setReview({ doc, action: 'APPROVE', reason: '', adminNotes: '' })}><Check size={13} /></Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => setReview({ doc, action: 'REJECT', reason: '', adminNotes: '' })}><X size={13} /></Button></div></div>
            </Card>;
          })}
        </div>}</section>

      {review && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><Card className="w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto"><h3 className="text-lg font-bold">{review.action === 'APPROVE' ? t('kyc.approve') : t('kyc.reject')}</h3><p className="mt-1 text-sm text-gray-500">{review.doc.type}</p>{review.action === 'REJECT' && <Textarea label={t('kyc.rejectionReason')} className="mt-3" rows={3} value={review.reason} onChange={(event) => setReview({ ...review, reason: event.target.value })} />}<Textarea label={t('kyc.adminNotes')} className="mt-3" rows={2} value={review.adminNotes} onChange={(event) => setReview({ ...review, adminNotes: event.target.value })} /><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setReview(null)}>{t('common.cancel')}</Button><Button variant={review.action === 'APPROVE' ? 'primary' : 'danger'} disabled={(review.action === 'REJECT' && !review.reason) || reviewMutation.isPending} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: review.doc.id, body: { action: review.action, reason: review.reason, adminNotes: review.adminNotes } })}>{review.action === 'APPROVE' ? t('kyc.approve') : t('kyc.reject')}</Button></div></Card></div>}
    </div>
  );
}
