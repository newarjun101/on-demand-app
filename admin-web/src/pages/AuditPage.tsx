import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { adminApi, AuditEntry } from '@/api/endpoints';
import { Avatar, Badge, Card, EmptyState, Skeleton } from '@/components/UI';
import { timeAgo } from '@/utils/format';

export function AuditPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['admin-audit', page], queryFn: () => adminApi.listAudit({ page, pageSize: 30 }) });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('audit.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('audit.subtitle')}</p>
      </div>
      {isLoading || !data ? <Skeleton className="h-32" /> : data.items.length === 0 ? <EmptyState title={t('audit.noEntries')} /> : (
        <div className="space-y-2">
          {data.items.map((a: any) => (
            <Card key={a.id} className="p-3">
              <div className="flex items-start gap-3">
                <Avatar name={a.actorName} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{a.actorName}</span>
                    <Badge color="indigo">{a.action}</Badge>
                    {a.targetType && <Badge color="gray">{a.targetType}</Badge>}
                    <span className="text-xs text-gray-500 ml-auto">{timeAgo(a.createdAt)}</span>
                  </div>
                  {a.reason && <div className="text-sm text-gray-600 mt-1">💬 {a.reason}</div>}
                  {a.targetId && <div className="text-xs text-gray-400 mt-0.5">target: {a.targetId.slice(0, 8)}…</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
