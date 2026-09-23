import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Briefcase, FileText, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi, AdminWorker, KycDocument } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Avatar, Badge, Button, Card, EmptyState, Input, Skeleton, Spinner, Textarea } from '@/components/UI';
import { useAdminAuth } from '@/contexts/AuthContext';
import { formatMmk, timeAgo } from '@/utils/format';
import { Pagination } from '@/components/Pagination';

export function WorkersPage() {
  const { t } = useI18n();
  const { hasPermission } = useAdminAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [rejectModal, setRejectModal] = useState<{ worker: AdminWorker; reason: string } | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ worker: AdminWorker; reason: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-workers', page, q, status],
    queryFn: () => adminApi.listWorkers({ page, pageSize: 20, q, status }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => adminApi.approveWorker(id),
    onSuccess: () => { toast.success(t('workers.approve') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-workers'] }); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectWorker(id, reason),
    onSuccess: () => { toast.success(t('workers.reject') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-workers'] }); setRejectModal(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const suspendMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.suspendWorker(id, reason),
    onSuccess: () => { toast.success(t('workers.suspend') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-workers'] }); setSuspendModal(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('workers.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('workers.subtitle')}</p>
      </div>

      <Card className="p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input placeholder={t('workers.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="all">{t('common.all')}</option>
          <option value="APPROVED">{t('workers.approved')}</option>
          <option value="PENDING">{t('workers.pending')}</option>
          <option value="REJECTED">{t('workers.rejected')}</option>
          <option value="SUSPENDED">{t('workers.suspended')}</option>
        </select>
      </Card>

      {isLoading || !data ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : data.items.length === 0 ? (
        <EmptyState title={t('workers.noWorkersFound')} />
      ) : (
        <>
        <Card>
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3">{t('auth.fullName')}</th>
                <th className="text-left py-2 px-3">{t('auth.email')}</th>
                <th className="text-left py-2 px-3">{t('auth.city')}</th>
                <th className="text-left py-2 px-3">{t('workers.verification')}</th>
                <th className="text-left py-2 px-3">{t('workers.rating')}</th>
                <th className="text-left py-2 px-3">{t('workers.jobs')}</th>
                <th className="text-right py-2 px-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((w: any) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={w.avatarUrl} name={w.fullName} size={28} />
                      <div>
                        <div className="font-medium">{w.fullName}</div>
                        {w.isBoosted && <Badge color="yellow">⭐ {t('workers.boosted')}</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{w.email || w.phone || '—'}</td>
                  <td className="py-2 px-3 text-gray-600">{w.city || '—'}</td>
                  <td className="py-2 px-3">
                    {w.verificationStatus === 'APPROVED' ? <Badge color="green">{t('workers.approved')}</Badge> :
                     w.verificationStatus === 'PENDING' ? <Badge color="yellow">{t('workers.pending')}</Badge> :
                     w.verificationStatus === 'REJECTED' ? <Badge color="red">{t('workers.rejected')}</Badge> :
                     <Badge color="gray">{t('workers.suspended')}</Badge>}
                  </td>
                  <td className="py-2 px-3">★ {w.ratingAverage.toFixed(1)} ({w.ratingCount})</td>
                  <td className="py-2 px-3">{w.completedJobs}</td>
                  <td className="py-2 px-3 text-right space-x-1">
                    {hasPermission('workers:verify') && w.verificationStatus === 'PENDING' && (
                      <>
                        <Button size="sm" onClick={() => approveMut.mutate(w.id)} loading={approveMut.isPending}><Check size={14} className="mr-1" /> {t('workers.approve')}</Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRejectModal({ worker: w, reason: '' })}><X size={14} className="mr-1" /> {t('workers.reject')}</Button>
                      </>
                    )}
                    {hasPermission('workers:suspend') && w.verificationStatus === 'APPROVED' && (
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setSuspendModal({ worker: w, reason: '' })}><X size={14} className="mr-1" /> {t('workers.suspend')}</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        </>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold">{t('workers.reject')}</h3>
            <p className="text-sm text-gray-500 mt-1">{rejectModal.worker.fullName}</p>
            <Textarea label={t('users.banReason')} className="mt-3" rows={3} value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectModal(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" disabled={!rejectModal.reason || rejectMut.isPending} loading={rejectMut.isPending} onClick={() => rejectMut.mutate({ id: rejectModal.worker.id, reason: rejectModal.reason })}>
                {t('workers.reject')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {suspendModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold">{t('workers.suspend')}</h3>
            <p className="text-sm text-gray-500 mt-1">{suspendModal.worker.fullName}</p>
            <Textarea label={t('users.banReason')} className="mt-3" rows={3} value={suspendModal.reason} onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSuspendModal(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" disabled={!suspendModal.reason || suspendMut.isPending} loading={suspendMut.isPending} onClick={() => suspendMut.mutate({ id: suspendModal.worker.id, reason: suspendModal.reason })}>
                {t('workers.suspend')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
