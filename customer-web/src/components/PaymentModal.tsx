import { useState } from 'react';
import toast from 'react-hot-toast';
import { bookingApi } from '@/api/endpoints';
import { Button, Spinner } from '@/components/UI';
import { formatMmk } from '@/utils/format';
import { Booking } from '@/types';

export function PaymentModal({
  booking,
  onClose,
  onPaid,
}: {
  booking: Booking;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState<'CASH_ON_COMPLETION' | 'KBZPAY' | 'WAVE_MONEY' | 'AYA_PAY'>('CASH_ON_COMPLETION');
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold">Confirm payment</h3>
        <p className="text-sm text-gray-500 mt-1">Total: <span className="font-semibold text-gray-900">{formatMmk(booking.total)}</span></p>
        <div className="mt-4 space-y-2">
          {[
            { v: 'CASH_ON_COMPLETION', l: 'Cash on completion' },
            { v: 'KBZPAY', l: 'KBZPay' },
            { v: 'WAVE_MONEY', l: 'Wave Money' },
            { v: 'AYA_PAY', l: 'AYA Pay' },
          ].map((m) => (
            <label key={m.v} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${method === m.v ? 'border-brand-500 bg-brand-50' : ''}`}>
              <input type="radio" name="method" checked={method === m.v as any} onChange={() => setMethod(m.v as any)} />
              <span className="text-sm">{m.l}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Gateway payments (KBZPay, Wave Money, AYA Pay) are stubbed for this MVP. Choose "Cash on completion" to record the payment.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await bookingApi.pay(booking.id, method);
                toast.success('Payment recorded');
                onPaid();
              } catch (e: any) {
                toast.error(e?.response?.data?.error?.message ?? 'Payment failed');
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Spinner size={16} /> : 'Confirm payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}