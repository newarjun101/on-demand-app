import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, Trash2, ShieldAlert, UserCheck, LogIn as ImpersonateIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi, AdminUser } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Avatar, Badge, Button, Card, EmptyState, Input, Select, Skeleton, Spinner } from '@/components/UI';
import { formatMmk } from '@/utils/format';
import { useAdminAuth } from '@/contexts/AuthContext';
import { useState as useStateReact } from 'react';
import { Pagination } from '@/components/Pagination';

export function UsersPage() {
  const { t } = useI18n();
  const { hasPermission } = useAdminAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | 'CUSTOMER' | 'WORKER' | 'ADMIN'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'banned' | 'inactive'>('all');
  const [banModal, setBanModal] = useState<{ user: AdminUser; reason: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, q, role, status],
    queryFn: () => adminApi.listUsers({ page, pageSize: 20, q, role, status }),
  });

  const banMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.banUser(id, reason),
    onSuccess: () => { toast.success(t('users.banUser') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setBanModal(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const unbanMut = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => { toast.success(t('users.unbanUser') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { toast.success(t('common.delete') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('users.subtitle')}</p>
      </div>

      <Card className="p-3 flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            placeholder={t('users.search')}
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          value={role}
          onChange={(e) => { setRole(e.target.value as any); setPage(1); }}
          options={[
            { value: 'all',       label: t('users.all') },
            { value: 'CUSTOMER',  label: t('users.customers') },
            { value: 'WORKER',    label: t('users.workers') },
            { value: 'ADMIN',     label: t('users.admins') },
          ]}
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
          options={[
            { value: 'all',       label: t('common.all') },
            { value: 'active',    label: t('common.active') },
            { value: 'banned',    label: t('common.banned') },
            { value: 'inactive',  label: t('common.inactive') },
          ]}
        />
      </Card>

      {isLoading || !data ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : data.items.length === 0 ? (
        <EmptyState title={t('users.noUsersFound')} />
      ) : (
        <>
          <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3">{t('auth.fullName')}</th>
                  <th className="text-left py-2 px-3">{t('auth.email')}</th>
                  <th className="text-left py-2 px-3">{t('auth.phone')}</th>
                  <th className="text-left py-2 px-3">{t('users.role')}</th>
                  <th className="text-left py-2 px-3">{t('common.status')}</th>
                  <th className="text-left py-2 px-3">{t('users.joined')}</th>
                  <th className="text-right py-2 px-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatarUrl} name={u.fullName} size={28} />
                        <div>
                          <div className="font-medium">{u.fullName}</div>
                          {u.workerProfile && (
                            <div className="text-xs text-gray-500">{u.workerProfile.city || '—'} · {u.workerProfile.verificationStatus}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{u.email || '—'}</td>
                    <td className="py-2 px-3 text-gray-600">{u.phone || '—'}</td>
                    <td className="py-2 px-3">
                      <Badge color={u.role === 'ADMIN' ? 'indigo' : u.role === 'WORKER' ? 'green' : 'gray'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      {u.isBanned ? (
                        <Badge color="red">{t('common.banned')}</Badge>
                      ) : u.isActive ? (
                        <Badge color="green">{t('common.active')}</Badge>
                      ) : (
                        <Badge color="gray">{t('common.inactive')}</Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link to={`/users/${u.id}`} className="inline-flex items-center px-2.5 py-1 mr-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-md">
                        View
                      </Link>
                      {u.isBanned ? (
                        hasPermission('users:ban') && (
                          <Button size="sm" variant="outline" onClick={() => unbanMut.mutate(u.id)} loading={unbanMut.isPending}>
                            <UserCheck size={14} className="mr-1" /> {t('users.unbanUser')}
                          </Button>
                        )
                      ) : (
                        hasPermission('users:ban') && (
                          <Button size="sm" variant="outline" onClick={() => setBanModal({ user: u, reason: '' })}>
                            <Ban size={14} className="mr-1" /> {t('users.banUser')}
                          </Button>
                        )
                      )}
                      {hasPermission('users:delete') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { if (confirm(t('users.banConfirm'))) deleteMut.mutate(u.id); }}
                          className="ml-1 text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Card>
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        </>
      )}

      {banModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold">{t('users.banUser')}</h3>
            <p className="text-sm text-gray-500 mt-1">{banModal.user.fullName} · {banModal.user.email}</p>
            <label className="block mt-4 text-sm font-medium text-gray-700">{t('users.banReason')}</label>
            <textarea
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
              value={banModal.reason}
              onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBanModal(null)}>{t('common.cancel')}</Button>
              <Button
                variant="danger"
                disabled={!banModal.reason || banMut.isPending}
                loading={banMut.isPending}
                onClick={() => banMut.mutate({ id: banModal.user.id, reason: banModal.reason })}
              >
                <Ban size={14} className="mr-1" /> {t('users.banUser')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
