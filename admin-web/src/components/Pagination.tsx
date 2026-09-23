import { useI18n } from '@/i18n';
import { Button } from './UI';

export function Pagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * pageSize, total);
  return <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
    <span>{from}–{to} / {total}</span>
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>{t('common.back')}</Button>
      <span>{page} / {totalPages}</span>
      <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>{t('common.next')}</Button>
    </div>
  </div>;
}
