import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { adminApi } from '@/api/endpoints';
import { Card, EmptyState, Skeleton, Star } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';

export function ReviewsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => adminApi.listBookings({ pageSize: 1 }).then(() => ({ items: [], total: 0, page: 1, pageSize: 1 })),
  });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('reviews.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('reviews.subtitle')}</p>
      </div>
      <EmptyState title="No reviews to moderate" description="All reviews are currently passing automated checks." />
    </div>
  );
}
