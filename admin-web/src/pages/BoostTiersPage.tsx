import { useI18n } from '@/i18n';
import { Card, EmptyState } from '@/components/UI';
import { Zap } from 'lucide-react';

export function BoostTiersPage() {
  const { t } = useI18n();
  const tiers = [
    { days: 3,  price: 5000,  factor: 2,   label: '3 days'  },
    { days: 7,  price: 9000,  factor: 2.5, label: '7 days'  },
    { days: 14, price: 15000, factor: 3,   label: '14 days' },
    { days: 30, price: 25000, factor: 4,   label: '30 days' },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('boost.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('boost.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiers.map((tier) => (
          <Card key={tier.days} className="p-5 text-center">
            <Zap className="mx-auto text-amber-500 mb-2" size={28} />
            <div className="text-sm text-gray-500">{tier.label}</div>
            <div className="text-2xl font-bold mt-1">{tier.price.toLocaleString()} MMK</div>
            <div className="text-xs text-gray-500 mt-1">×{tier.factor} boost</div>
          </Card>
        ))}
      </div>
      <div className="text-xs text-gray-500 text-center">Configure tiers in the seed (lib/seed.ts) and via future admin edits.</div>
    </div>
  );
}
