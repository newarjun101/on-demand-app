import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, PauseCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/endpoints';
import { Card, Badge, Button, Spinner } from '@/components/UI';
import { formatDate } from '@/utils/format';

export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const { data: worker, isLoading, isError } = useQuery({
    queryKey: ['admin-worker', id],
    queryFn: () => adminApi.getWorker(id!),
    enabled: !!id,
  });

  const approveMut = useMutation({
    mutationFn: () => adminApi.approveWorker(id!),
    onSuccess: () => {
      toast.success('Worker approved');
      qc.invalidateQueries({ queryKey: ['admin-worker', id] });
      qc.invalidateQueries({ queryKey: ['admin-workers'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to approve'),
  });

  const rejectMut = useMutation({
    mutationFn: () => adminApi.rejectWorker(id!, reason || 'Rejected by admin'),
    onSuccess: () => {
      toast.success('Worker rejected');
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin-worker', id] });
      qc.invalidateQueries({ queryKey: ['admin-workers'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to reject'),
  });

  const suspendMut = useMutation({
    mutationFn: () => adminApi.suspendWorker(id!, reason || 'Suspended by admin'),
    onSuccess: () => {
      toast.success('Worker suspended');
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin-worker', id] });
      qc.invalidateQueries({ queryKey: ['admin-workers'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to suspend'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={32} /></div>;
  if (isError || !worker) return <Card><p className="text-red-600">Worker not found.</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/workers')}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{worker.user?.fullName || worker.id}</h1>
          <Badge color={worker.verificationStatus === 'APPROVED' ? 'green' : worker.verificationStatus === 'REJECTED' ? 'red' : 'yellow'}>
            {worker.verificationStatus}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/kyc/${worker.id}`}>
            <Button variant="secondary"><FileText size={16} className="mr-1" /> KYC Review</Button>
          </Link>
          <Button onClick={() => approveMut.mutate()} disabled={approveMut.isPending}>
            <CheckCircle size={16} className="mr-1" /> Approve
          </Button>
          <input
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button variant="danger" onClick={() => rejectMut.mutate()} disabled={rejectMut.isPending}>
            <XCircle size={16} className="mr-1" /> Reject
          </Button>
          <Button variant="secondary" onClick={() => suspendMut.mutate()} disabled={suspendMut.isPending}>
            <PauseCircle size={16} className="mr-1" /> Suspend
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Worker Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Worker ID</dt><dd className="font-mono">{worker.id}</dd></div>
            <div className="flex justify-between">
              <dt className="text-slate-500">User</dt>
              <dd><Link to={`/users/${worker.userId}`} className="text-indigo-600 hover:underline">{worker.user?.fullName}</Link></dd>
            </div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{worker.user?.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{worker.user?.phone || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Service Radius</dt><dd>{worker.serviceRadiusKm} km</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Completed Jobs</dt><dd>{worker.completedJobs}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Rating</dt><dd>{worker.ratingAverage} ({worker.ratingCount})</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Joined</dt><dd>{formatDate(worker.createdAt)}</dd></div>
          </dl>
          {worker.bio && <p className="mt-4 text-sm text-slate-600 border-t pt-3">{worker.bio}</p>}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Offered Services ({worker.services?.length || 0})</h2>
          <ul className="space-y-2 text-sm">
            {worker.services?.map((ws: any) => (
              <li key={ws.id} className="flex justify-between border-b pb-2">
                <span>{ws.service?.name}</span>
                <span className="text-slate-500">{ws.basePrice ? `${ws.basePrice} MMK` : 'Quote'}</span>
              </li>
            ))}
            {(!worker.services || worker.services.length === 0) && <p className="text-slate-500">No services configured.</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
