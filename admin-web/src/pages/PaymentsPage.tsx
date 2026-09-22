import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { adminApi } from '@/api/endpoints';
import { Card, EmptyState, Skeleton } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';
import { CreditCard } from 'lucide-react';

export function PaymentsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ['admin-payments-page'], queryFn: () => adminApi.listBookings({ pageSize: 50 }) });
  const paid = (data?.items || []).filter((b: any) => b.status === 'COMPLETED');
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('payments.subtitle')}</p>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : paid.length === 0 ? <EmptyState title="No payments" /> : (
        <Card>
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3">Service</th>
                <th className="text-left py-2 px-3">Customer</th>
                <th className="text-right py-2 px-3">Total</th>
                <th className="text-right py-2 px-3">Fee</th>
                <th className="text-right py-2 px-3">Worker</th>
                <th className="text-left py-2 px-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paid.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3">{b.serviceName}</td>
                  <td className="py-2 px-3">{b.customerName}</td>
                  <td className="py-2 px-3 text-right font-medium">{formatMmk(b.total)}</td>
                  <td className="py-2 px-3 text-right text-green-700">{formatMmk(b.platformFee)}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{formatMmk(b.workerEarnings)}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{timeAgo(b.completedAt || b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
