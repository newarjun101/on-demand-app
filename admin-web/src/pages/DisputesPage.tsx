import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { adminApi } from '@/api/endpoints';
import { Badge, Card, EmptyState, Skeleton } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';

export function DisputesPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => adminApi.listBookings({ pageSize: 1 }),
  });
  const disputes = (data?.items || []).filter((b: any) => b.status === 'DISPUTED');
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('disputes.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('disputes.subtitle')}</p>
      </div>
      {disputes.length === 0 ? (
        <EmptyState title="No active disputes" />
      ) : (
        <div className="space-y-2">
          {disputes.map((b: any) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-center gap-2">
                <Badge color="red">DISPUTED</Badge>
                <span className="font-medium">{b.serviceName}</span>
                <span className="text-sm text-gray-500 ml-auto">{timeAgo(b.createdAt)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">{b.customerName} vs {b.workerName} · {formatMmk(b.total)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
