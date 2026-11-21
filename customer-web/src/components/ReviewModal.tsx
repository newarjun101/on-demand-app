import { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewApi } from '@/api/endpoints';
import { Button, Spinner } from '@/components/UI';

export function ReviewModal({
  bookingId,
  onClose,
  onSubmitted,
}: {
  bookingId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold">Leave a review</h3>
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className="p-1">
              <Star
                size={28}
                fill={n <= rating ? '#facc15' : '#e5e7eb'}
                stroke={n <= rating ? '#facc15' : '#e5e7eb'}
              />
            </button>
          ))}
        </div>
        <textarea
          className="mt-3 w-full border rounded-lg p-3 text-sm"
          rows={4}
          placeholder="Tell others about your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await reviewApi.create(bookingId, rating, comment);
                toast.success('Thanks for your review!');
                onSubmitted();
              } catch (e: any) {
                toast.error(e?.response?.data?.error?.message ?? 'Failed');
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Spinner size={16} /> : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}