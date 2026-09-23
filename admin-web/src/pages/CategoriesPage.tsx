import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi, AdminCategory } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Badge, Button, Card, EmptyState, Input, Skeleton, Spinner } from '@/components/UI';
import { useAdminAuth } from '@/contexts/AuthContext';
import { Pagination } from '@/components/Pagination';

export function CategoriesPage() {
  const { t } = useI18n();
  const { hasPermission } = useAdminAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<AdminCategory> | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: () => adminApi.listCategories() });
  const saveMut = useMutation({
    mutationFn: (body: any) => editing?.id ? adminApi.updateCategory(editing.id, body) : adminApi.createCategory(body),
    onSuccess: () => { toast.success(t('common.save') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); setEditing(null); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => { toast.success(t('common.delete') + ' ✓'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: (e: any) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('categories.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('categories.subtitle')}</p>
        </div>
        {hasPermission('categories:create') && (
          <Button onClick={() => setEditing({ name: '', slug: '', icon: '' })}>
            <Plus size={14} className="mr-1" /> {t('categories.addCategory')}
          </Button>
        )}
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-32" />
      ) : data.length === 0 ? (
        <EmptyState title={t('categories.noCategories')} icon={FolderTree} />
      ) : (
        <>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.slice((page - 1) * pageSize, page * pageSize).map((c: any) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.icon || '📁'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.slug} · {c.serviceCount} services</div>
                </div>
                {!c.isActive && <Badge color="gray">Inactive</Badge>}
              </div>
              {hasPermission('categories:edit') && (
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Edit size={12} /></Button>
                  {hasPermission('categories:delete') && (
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(c.id); }}><Trash2 size={12} /></Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
        <Pagination page={page} pageSize={pageSize} total={data.length} onPageChange={setPage} />
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold">{editing.id ? t('common.edit') : t('categories.addCategory')}</h3>
            <div className="mt-3 space-y-3">
              <Input label={t('categories.icon')} placeholder="🏠" value={editing.icon ?? ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
              <Input label={t('auth.fullName')} value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: (editing.slug || e.target.value).toLowerCase().replace(/[^a-z0-9]+/g, '-') })} />
              <Input label={t('categories.sortOrder')} type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
              <Button disabled={!editing.name || saveMut.isPending} loading={saveMut.isPending} onClick={() => saveMut.mutate({ name: editing.name, slug: editing.slug || '', icon: editing.icon, sortOrder: editing.sortOrder })}>
                {t('common.save')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
