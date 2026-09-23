import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Users, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi, AdminRole, Permission } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Badge, Button, Card, EmptyState, Input, Skeleton, Spinner, Textarea } from '@/components/UI';
import { Pagination } from '@/components/Pagination';

export function RolesPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<AdminRole> | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const { data: roles, isLoading } = useQuery({ queryKey: ['admin-roles'], queryFn: () => adminApi.listRoles() });
  const { data: permissions } = useQuery({ queryKey: ['admin-permissions'], queryFn: () => adminApi.getPermissions() });
  const saveMut = useMutation({
    mutationFn: (body: any) => editing?.id ? adminApi.updateRole(editing.id, body) : adminApi.createRole(body),
    onSuccess: () => { toast.success(t('common.saveChanges') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-roles'] }); setEditing(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteRole(id),
    onSuccess: () => { toast.success(t('common.delete') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-roles'] }); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const assignMut = useMutation({
    mutationFn: ({ id, name, permissions }: any) => adminApi.updateRole(id, { name, permissions }),
    onSuccess: () => { toast.success(t('common.saveChanges') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-roles'] }); setEditing(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('roles.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('roles.subtitle')}</p>
        </div>
        <Button onClick={() => setEditing({ name: '', slug: '', description: '', permissions: [] })}>
          <Plus size={14} className="mr-1" /> {t('roles.newRole')}
        </Button>
      </div>
      {isLoading || !roles ? <Skeleton className="h-32" /> : (
        <>
        <div className="grid md:grid-cols-2 gap-3">
          {roles.slice((page - 1) * pageSize, page * pageSize).map((r: any) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center gap-2">
                <div className="font-semibold flex-1">{r.name}</div>
                {r.isBuiltIn && <Badge color="indigo">built-in</Badge>}
                <Badge color="blue">{r.userCount} {t('roles.usersWithRole')}</Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">slug: <code>{r.slug}</code></div>
              {r.description && <div className="text-sm text-gray-600 mt-1">{r.description}</div>}
              <div className="text-xs text-gray-500 mt-2">Permissions: {(r.permissions || []).length}</div>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Edit size={12} /></Button>
                {!r.isBuiltIn && (
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(r.id); }}><Trash2 size={12} /></Button>
                )}
              </div>
            </Card>
          ))}
        </div>
        <Pagination page={page} pageSize={pageSize} total={roles.length} onPageChange={setPage} />
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">{editing.id ? t('roles.editRole') : t('roles.newRole')}</h3>
            <div className="mt-3 space-y-3">
              <Input label={t('roles.roleName')} value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: (editing.slug || e.target.value).toLowerCase().replace(/[^a-z0-9_]+/g, '_') })} disabled={!!editing.isBuiltIn} />
              <Input label={t('roles.roleSlug')} value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} disabled={!!editing.isBuiltIn} />
              <Textarea label={t('roles.description')} rows={2} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <div>
                <div className="text-sm font-medium mb-1">{t('roles.permissions')}</div>
                <div className="text-xs text-gray-500 mb-2">{t('roles.permissionsHint')}</div>
                <div className="border border-gray-200 rounded-lg p-2 max-h-64 overflow-y-auto space-y-1">
                  {(permissions || []).map((p: any) => {
                    const isChecked = editing.permissions?.includes(p.key);
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-sm px-1">
                        <input
                          type="checkbox"
                          checked={!!isChecked}
                          onChange={(e) => {
                            const set = new Set(editing.permissions || []);
                            if (e.target.checked) set.add(p.key); else set.delete(p.key);
                            setEditing({ ...editing, permissions: Array.from(set) });
                          }}
                        />
                        <span className="font-mono text-xs">{p.key}</span>
                        {p.description && <span className="text-xs text-gray-500">— {p.description}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
              {!editing.isBuiltIn && (
                <Button disabled={!editing.name || saveMut.isPending} loading={saveMut.isPending} onClick={() => saveMut.mutate({
                  name: editing.name, slug: editing.slug, description: editing.description, permissions: editing.permissions,
                })}>
                  {t('common.save')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
