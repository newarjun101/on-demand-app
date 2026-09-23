import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, FileText, ExternalLink, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi, KycDocument } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Textarea } from '@/components/UI';
import { timeAgo } from '@/utils/format';

export function KycPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState<{ doc: KycDocument; action: 'APPROVE' | 'REJECT' | 'NEEDS_MORE_INFO'; reason: string; adminNotes: string } | null>(null);
  const [detail, setDetail] = useState<KycDocument | null>(null);
  const detailQuery = useQuery({
    queryKey: ['admin-kyc-detail', detail?.workerProfileId],
    queryFn: () => adminApi.workerDocuments(detail!.workerProfileId),
    enabled: !!detail,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-kyc', page],
    queryFn: () => adminApi.listKyc({ page, status: 'PENDING' }),
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => adminApi.reviewKyc(id, body),
    onSuccess: () => { toast.success(t('common.save') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-kyc'] }); setReviewModal(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('kyc.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('kyc.subtitle')}</p>
      </div>

      {isLoading || !data ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : data.items.length === 0 ? (
        <EmptyState title={t('kyc.noPendingDocs')} />
      ) : (
        <div className="space-y-2">
          {data.items.map((d: any) => {
            const apiBase = (import.meta.env.VITE_API_URL as string)?.replace(/\/api$/, '') || 'http://localhost:4000';
            return (
              <Card key={d.id} className="p-4">
                <div className="flex items-start gap-4">
                  <FileText size={32} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{d.workerName || d.workerProfileId}</span>
                      <Badge color="indigo">{d.type}</Badge>
                      <Badge color={d.status === 'PENDING' ? 'yellow' : d.status === 'APPROVED' ? 'green' : d.status === 'REJECTED' ? 'red' : 'gray'}>
                        {d.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {d.fileName} · {timeAgo(d.createdAt)} · {d.workerEmail}
                    </div>
                    {d.workerNotes && <div className="text-sm text-gray-600 mt-1">📝 {d.workerNotes}</div>}
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setDetail(d)}><Eye size={14} className="mr-1" /> {t('kyc.details')}</Button>
                      <a href={`${apiBase}${d.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1">
                        {t('kyc.viewDocument')} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" onClick={() => setReviewModal({ doc: d, action: 'APPROVE', reason: '', adminNotes: '' })}>
                      <Check size={14} className="mr-1" /> {t('kyc.approve')}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setReviewModal({ doc: d, action: 'REJECT', reason: '', adminNotes: '' })}>
                      <X size={14} className="mr-1" /> {t('kyc.reject')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold">
              {reviewModal.action === 'APPROVE' ? t('kyc.approve') : t('kyc.reject')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{reviewModal.doc.workerName}</p>
            {reviewModal.action === 'REJECT' && (
              <Textarea
                label={t('kyc.rejectionReason')}
                className="mt-3"
                rows={3}
                value={reviewModal.reason}
                onChange={(e) => setReviewModal({ ...reviewModal, reason: e.target.value })}
              />
            )}
            <Textarea
              label={t('kyc.adminNotes')}
              className="mt-3"
              rows={2}
              value={reviewModal.adminNotes}
              onChange={(e) => setReviewModal({ ...reviewModal, adminNotes: e.target.value })}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewModal(null)}>{t('common.cancel')}</Button>
              <Button
                variant={reviewModal.action === 'APPROVE' ? 'primary' : 'danger'}
                disabled={(reviewModal.action === 'REJECT' && !reviewModal.reason) || reviewMut.isPending}
                loading={reviewMut.isPending}
                onClick={() => reviewMut.mutate({ id: reviewModal.doc.id, body: { action: reviewModal.action, reason: reviewModal.reason, adminNotes: reviewModal.adminNotes } })}
              >
                {reviewModal.action === 'APPROVE' ? t('kyc.approve') : t('kyc.reject')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-lg font-bold">{t('kyc.details')}</h3><p className="text-sm text-gray-500">{detail.workerName} · {detail.workerEmail}</p></div>
              <Button variant="ghost" onClick={() => setDetail(null)}><X size={18} /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {(detailQuery.data ?? []).map((doc: KycDocument) => {
                const apiBase = (import.meta.env.VITE_API_URL as string)?.replace(/\/api$/, '') || 'http://localhost:4000';
                const previewable = /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName || doc.fileUrl);
                return <Card key={doc.id} className="p-3 border">
                  <div className="flex items-center justify-between gap-2"><Badge color="indigo">{doc.type}</Badge><Badge color={doc.status === 'APPROVED' ? 'green' : doc.status === 'REJECTED' ? 'red' : 'yellow'}>{doc.status}</Badge></div>
                  {previewable ? <img src={`${apiBase}${doc.fileUrl}`} alt={doc.type} className="mt-3 w-full aspect-video object-contain bg-gray-100 rounded" /> : <div className="mt-3 h-32 bg-gray-100 rounded flex items-center justify-center"><FileText size={36} className="text-gray-400" /></div>}
                  <div className="mt-2 text-xs text-gray-500">{doc.fileName}</div>
                  <div className="mt-2 flex gap-2"><a href={`${apiBase}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 inline-flex items-center gap-1">{t('kyc.viewDocument')} <ExternalLink size={12} /></a><Button size="sm" onClick={() => setReviewModal({ doc, action: 'APPROVE', reason: '', adminNotes: '' })}><Check size={12} /></Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => setReviewModal({ doc, action: 'REJECT', reason: '', adminNotes: '' })}><X size={12} /></Button></div>
                </Card>;
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
