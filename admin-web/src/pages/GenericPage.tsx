import { useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Card } from '@/components/UI';
import { Lock } from 'lucide-react';
export function GenericPage({ titleKey, hint }: { titleKey: string; hint?: string }) {
  const { t } = useI18n();
  const params = useParams();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t(titleKey as any) || titleKey}</h1>
        {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      </div>
      <Card className="p-12 text-center">
        <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 items-center justify-center mb-3">
          <Lock size={20} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Coming soon</h3>
        <p className="text-sm text-gray-500 mt-1">This section's full UI is being built. Backend, roles, and audit logging are in place.</p>
        {Object.keys(params).length > 0 && (
          <pre className="mt-4 inline-block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
            params: {JSON.stringify(params)}
          </pre>
        )}
      </Card>
    </div>
  );
}
