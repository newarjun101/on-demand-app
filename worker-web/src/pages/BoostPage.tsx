import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Check, Clock, TrendingUp, ArrowUp, CreditCard, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { boostApi } from '@/api/endpoints';
import { Badge, Button, Card, EmptyState, Skeleton, Spinner } from '@/components/UI';
import { formatMmk, timeAgo } from '@/utils/format';

export function BoostPage() {
  const { user, profile, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_COMPLETION' | 'KBZPAY' | 'WAVE_MONEY' | 'AYA_PAY'>('CASH_ON_COMPLETION');
  const [purchasing, setPurchasing] = useState(false);

  const { data: pricing, isLoading: pricingLoading } = useQuery({ queryKey: ['boost-pricing'], queryFn: boostApi.pricing });
  const { data: myBoosts, isLoading: boostsLoading } = useQuery({ queryKey: ['my-boosts'], queryFn: boostApi.myBoosts });

  const purchaseMut = useMutation({
    mutationFn: () => {
      if (selectedTier == null) throw new Error('Pick a tier');
      const tier = pricing!.tiers[selectedTier];
      return boostApi.purchase({ durationDays: tier.days, amount: tier.amount, paymentMethod });
    },
    onSuccess: async () => {
      toast.success('Boost activated! Your profile will appear at the top of search results.');
      await refresh();
      queryClient.invalidateQueries({ queryKey: ['my-boosts'] });
      setSelectedTier(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? 'Could not activate boost'),
    onSettled: () => setPurchasing(false),
  });

  if (!user) return null;
  const isCurrentlyBoosted = myBoosts?.isBoosted ?? false;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center">
          <Zap size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boost your profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get to the top of search results and reach more customers</p>
        </div>
      </div>

      {/* Current status */}
      <Card className="p-5 mt-6 border-amber-200 bg-amber-50/40">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-gray-600">Current status</div>
            <div className="mt-1">
              {isCurrentlyBoosted ? (
                <Badge color="green">
                  <Zap size={10} className="inline mr-1" fill="currentColor" /> Boosted · expires {myBoosts?.boostExpiresAt ? new Date(myBoosts.boostExpiresAt).toLocaleDateString() : 'soon'}
                </Badge>
              ) : (
                <span className="text-gray-900 font-medium">Not boosted</span>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {profile?.ratingAverage?.toFixed(1)} ★ · {profile?.completedJobs} jobs
          </div>
        </div>
      </Card>

      {/* How it works */}
      <Card className="p-6 mt-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><TrendingUp size={16} /> How boosting works</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" /> Your profile appears <strong>at the top</strong> of search results for the chosen period</li>
          <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" /> Customers searching for your services see you <strong>first</strong></li>
          <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" /> A <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">Boosted</span> badge shows on your cards</li>
          <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" /> Stacks on top of rating, reviews and experience</li>
        </ul>
      </Card>

      {/* Pricing tiers */}
      <h2 className="font-semibold text-gray-900 mt-8 mb-3">Pick a duration</h2>
      {pricingLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {pricing!.tiers.map((tier, i) => {
            const selected = selectedTier === i;
            return (
              <button
                key={tier.days}
                type="button"
                onClick={() => setSelectedTier(i)}
                className={clsx(
                  'text-left p-4 rounded-xl border-2 transition',
                  selected ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-gray-200 bg-white hover:border-amber-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{tier.label}</div>
                  {i === 2 && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">POPULAR</span>}
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{formatMmk(tier.amount)}</div>
                <div className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1">
                  <ArrowUp size={10} /> {tier.boostFactor}× boost
                </div>
                {selected && <div className="mt-2 text-xs font-semibold text-amber-700 inline-flex items-center gap-1"><Check size={12} /> Selected</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* Payment method */}
      {selectedTier != null && (
        <Card className="p-5 mt-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><CreditCard size={16} /> Payment method</h2>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {([
              { v: 'CASH_ON_COMPLETION', l: 'Cash on completion', d: 'Pay the boost fee on your next payout' },
              { v: 'KBZPAY', l: 'KBZPay', d: 'Coming soon' },
              { v: 'WAVE_MONEY', l: 'Wave Money', d: 'Coming soon' },
              { v: 'AYA_PAY', l: 'AYA Pay', d: 'Coming soon' },
            ] as const).map((m) => {
              const disabled = m.v !== 'CASH_ON_COMPLETION';
              return (
                <label
                  key={m.v}
                  className={clsx(
                    'flex items-center gap-3 p-3 border rounded-lg',
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50',
                    paymentMethod === m.v && !disabled ? 'border-amber-500 bg-amber-50' : 'border-gray-200',
                  )}
                >
                  <input
                    type="radio"
                    disabled={disabled}
                    checked={paymentMethod === m.v}
                    onChange={() => !disabled && setPaymentMethod(m.v)}
                  />
                  <div>
                    <div className="text-sm font-medium">{m.l}</div>
                    <div className="text-xs text-gray-500">{m.d}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm flex items-start gap-2">
            <Clock size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              Your boost will be active <strong>immediately</strong> after confirmation. For CASH_ON_COMPLETION, the fee will be deducted from your next booking payout.
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => { setPurchasing(true); purchaseMut.mutate(); }} disabled={purchasing}>
              {purchasing ? <Spinner size={16} /> : <><Zap size={16} className="mr-2" /> Activate boost</>}
            </Button>
          </div>
        </Card>
      )}

      {/* History */}
      <h2 className="font-semibold text-gray-900 mt-8 mb-3">Boost history</h2>
      {boostsLoading ? <Skeleton className="h-24" /> : (myBoosts?.boosts.length ?? 0) === 0 ? (
        <EmptyState title="No boosts yet" description="Pick a duration above to get your first boost." />
      ) : (
        <Card>
          <div className="divide-y">
            {(myBoosts?.boosts ?? []).map((b: any) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-900">{b.durationDays}-day boost</div>
                  <div className="text-xs text-gray-500">
                    {timeAgo(b.startsAt)} · expires {new Date(b.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatMmk(b.amount)}</div>
                  <Badge color={b.status === 'ACTIVE' ? 'green' : 'gray'}>{b.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}