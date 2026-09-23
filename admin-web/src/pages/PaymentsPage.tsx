import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { adminApi } from '@/api/endpoints';
import { Card, EmptyState, Skeleton } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';
import { CreditCard } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export function PaymentsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['admin-payments-page', page], queryFn: () => adminApi.listPayments({ page, pageSize: 20 }) });
  const payments = data?.items || [];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('payments.subtitle')}</p>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : payments.length === 0 ? <EmptyState title="No payments" /> : (
        <Card>
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3">Customer</th>
                <th className="text-right py-2 px-3">Total</th>
                <th className="text-right py-2 px-3">Worker</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3">{payment.payer?.fullName || '—'}</td>
                  <td className="py-2 px-3 text-right font-medium">{formatMmk(payment.amount)}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{payment.receiver?.fullName || '—'}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{payment.status}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{timeAgo(payment.paidAt || payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
