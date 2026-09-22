import { useI18n } from '@/i18n';
import { Card, EmptyState, Bell } from '@/components/UI';
import { timeAgo } from '@/utils/format';

export function NotificationsPage() {
  const { t } = useI18n();
  // No dedicated /admin/notifications endpoint yet — show placeholder
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('notifications.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">All notifications on the platform</p>
      </div>
      <EmptyState title="No recent notifications" icon={Bell} description="Broadcasts and system notifications will appear here." />
    </div>
  );
}
