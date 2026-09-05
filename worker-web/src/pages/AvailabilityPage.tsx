import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { workerApi } from '@/api/endpoints';
import { Button, Card, Input, Spinner } from '@/components/UI';
import clsx from 'clsx';

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

export function AvailabilityPage() {
  const { profile, refresh } = useAuth();
  const [entries, setEntries] = useState(() => {
    return DAYS.map((d) => {
      const existing = (profile as any)?.availability?.find((a: any) => a.day === d);
      return { day: d, isAvailable: existing?.isAvailable ?? (d !== 'SUNDAY'), startTime: existing?.startTime ?? '08:00', endTime: existing?.endTime ?? '18:00' };
    });
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await workerApi.setAvailability(entries);
      await refresh();
      toast.success('Availability saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Save failed');
    } finally { setSaving(false); }
  }

  const isOnline = profile?.isOnline ?? false;
  const isAccepting = profile?.isAcceptingJobs ?? false;

  async function toggleStatus() {
    try {
      await workerApi.setStatus(!isOnline, !isOnline);
      await refresh();
      toast.success(isOnline ? 'You are now offline' : 'You are now online');
    } catch (e: any) { toast.error('Could not change status'); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
      <p className="text-sm text-gray-500 mt-1">Set your working hours and online status</p>

      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Online status</div>
            <div className="text-sm text-gray-500">{isOnline && isAccepting ? 'You are visible and accepting jobs' : isOnline ? 'Online but not accepting jobs' : 'You are invisible to customers'}</div>
          </div>
          <button
            onClick={toggleStatus}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition',
              isOnline ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
            )}
          >
            {isOnline ? <Bell size={16} /> : <BellOff size={16} />}
            {isOnline ? 'Go offline' : 'Go online'}
          </button>
        </div>
      </Card>

      <Card className="p-6 mt-4">
        <h2 className="font-semibold">Working hours</h2>
        <div className="mt-4 space-y-2">
          {entries.map((e, i) => (
            <div key={e.day} className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={e.isAvailable}
                onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, isAvailable: ev.target.checked } : x))}
              />
              <div className="font-medium w-28">{e.day.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</div>
              <input
                type="time"
                disabled={!e.isAvailable}
                value={e.startTime}
                onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, startTime: ev.target.value } : x))}
                className="px-2 py-1.5 border rounded-lg disabled:opacity-50"
              />
              <span>to</span>
              <input
                type="time"
                disabled={!e.isAvailable}
                value={e.endTime}
                onChange={(ev) => setEntries(entries.map((x, idx) => idx === i ? { ...x, endTime: ev.target.value } : x))}
                className="px-2 py-1.5 border rounded-lg disabled:opacity-50"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? <Spinner size={16} /> : 'Save hours'}</Button>
        </div>
      </Card>
    </div>
  );
}