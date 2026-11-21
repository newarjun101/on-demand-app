import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/endpoints';
import { Card, Badge, Button, Spinner } from '@/components/UI';
import { formatDate } from '@/utils/format';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [banReason, setBanReason] = useState('');

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.getUser(id!),
    enabled: !!id,
  });

  const banMut = useMutation({
    mutationFn: () => adminApi.banUser(id!, banReason || 'Banned by admin'),
    onSuccess: () => {
      toast.success('User banned');
      setBanReason('');
      qc.invalidateQueries({ queryKey: ['admin-user', id] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to ban user'),
  });

  const unbanMut = useMutation({
    mutationFn: () => adminApi.unbanUser(id!),
    onSuccess: () => {
      toast.success('User unbanned');
      qc.invalidateQueries({ queryKey: ['admin-user', id] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to unban user'),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.deleteUser(id!),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      navigate('/users');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || 'Failed to delete user'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={32} /></div>;
  if (isError || !user) return <Card><p className="text-red-600">User not found.</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/users')}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
          <Badge color={user.isBanned ? 'red' : user.isActive ? 'green' : 'yellow'}>
            {user.isBanned ? 'BANNED' : user.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user.isBanned ? (
            <Button variant="secondary" onClick={() => unbanMut.mutate()} disabled={unbanMut.isPending}>
              <CheckCircle size={16} className="mr-1" /> Unban
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                placeholder="Ban reason..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
              <Button variant="danger" onClick={() => banMut.mutate()} disabled={banMut.isPending}>
                <Ban size={16} className="mr-1" /> Ban
              </Button>
            </div>
          )}
          <Button variant="danger" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
            <Trash2 size={16} className="mr-1" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Account Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">ID</dt><dd className="font-mono">{user.id}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{user.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{user.phone || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd><Badge>{user.role}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd>{formatDate(user.createdAt)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Last Login</dt><dd>{user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</dd></div>
            {user.bannedReason && (
              <div className="flex justify-between"><dt className="text-slate-500">Ban Reason</dt><dd className="text-red-600">{user.bannedReason}</dd></div>
            )}
          </dl>
        </Card>

        {user.workerProfile && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Worker Profile</h2>
              <Link to={`/workers/${user.workerProfile.id}`} className="text-sm text-indigo-600 hover:underline">
                View Worker Detail →
              </Link>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Verification</dt><dd><Badge>{user.workerProfile.verificationStatus}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Completed Jobs</dt><dd>{user.workerProfile.completedJobs}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Rating</dt><dd>{user.workerProfile.ratingAverage} ({user.workerProfile.ratingCount})</dd></div>
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}
