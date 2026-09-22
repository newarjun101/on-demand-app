import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, BellOff, Plus, Trash2, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { workerApi } from '@/api/endpoints';
import { Button, Card, Spinner } from '@/components/UI';
import clsx from 'clsx';

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

interface TimeSlot {
  startTime: string;
  endTime: string;
}
interface DayEntry {
  day: string;
  isAvailable: boolean;
  slots: TimeSlot[];
}

function defaultSlots(): TimeSlot[] {
  return [{ startTime: '08:00', endTime: '18:00' }];
}

function parseExisting(profile: any, day: string): DayEntry {
  const existing = (profile?.availability ?? []).find((a: any) => a.day === day);
  if (!existing) {
    return { day, isAvailable: day !== 'SUNDAY', slots: defaultSlots() };
  }
  // Backward compat: if startTime/endTime are set, treat as one slot
  const slots: TimeSlot[] = (existing.slots && Array.isArray(existing.slots) && existing.slots.length)
    ? existing.slots
    : (existing.startTime && existing.endTime
        ? [{ startTime: existing.startTime, endTime: existing.endTime }]
        : defaultSlots());
  return { day, isAvailable: !!existing.isAvailable, slots };
}

function validateSlot(s: TimeSlot, day: string, all: DayEntry[]): string | null {
  if (!/^\d{2}:\d{2}$/.test(s.startTime) || !/^\d{2}:\d{2}$/.test(s.endTime)) return 'Invalid time';
  if (s.endTime <= s.startTime) return 'End time must be after start time';
  // Check overlap with other slots in same day
  const other = all.filter((x) => x.day === day).flatMap((x) => x.slots).filter((x) => x !== s);
  for (const o of other) {
    if (s.startTime < o.endTime && o.startTime < s.endTime) return 'Time slots overlap';
  }
  return null;
}

export function AvailabilityPage() {
  const { profile, refresh } = useAuth();
  const [entries, setEntries] = useState<DayEntry[]>(() => DAYS.map((d) => parseExisting(profile, d)));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      // Strip empty slots & send the full structure
      const payload = {
        entries: entries.map((e) => ({
          day: e.day,
          isAvailable: e.isAvailable,
          startTime: e.slots[0]?.startTime ?? '08:00',
          endTime: e.slots[e.slots.length - 1]?.endTime ?? '18:00',
          slots: e.slots,
        })),
      };
      await workerApi.setAvailability(payload.entries as any);
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

  function updateEntry(day: string, patch: Partial<DayEntry>) {
    setEntries((prev) => prev.map((e) => (e.day === day ? { ...e, ...patch } : e)));
  }
  function addSlot(day: string) {
    setEntries((prev) => prev.map((e) => {
      if (e.day !== day) return e;
      const last = e.slots[e.slots.length - 1] ?? { startTime: '08:00', endTime: '12:00' };
      // Suggest a new slot one hour after the last ended, capped at 21:00
      const [h, m] = last.endTime.split(':').map(Number);
      const newStart = `${String(Math.min(20, h + 1)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const newEnd = `${String(Math.min(22, h + 3)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return { ...e, slots: [...e.slots, { startTime: newStart, endTime: newEnd }] };
    }));
  }
  function removeSlot(day: string, idx: number) {
    setEntries((prev) => prev.map((e) =>
      e.day === day ? { ...e, slots: e.slots.filter((_, i) => i !== idx) } : e,
    ));
  }
  function updateSlot(day: string, idx: number, patch: Partial<TimeSlot>) {
    setEntries((prev) => prev.map((e) => {
      if (e.day !== day) return e;
      return { ...e, slots: e.slots.map((s, i) => i === idx ? { ...s, ...patch } : s) };
    }));
  }
  function copyToAll(sourceDay: string) {
    const source = entries.find((e) => e.day === sourceDay);
    if (!source) return;
    setEntries((prev) => prev.map((e) =>
      e.day === sourceDay ? e : { ...e, isAvailable: source.isAvailable, slots: source.slots.map((s) => ({ ...s })) },
    ));
    toast.success(`Copied ${DAY_LABELS[sourceDay]} schedule to all days`);
  }
  function applyWeekdays() {
    setEntries((prev) => prev.map((e) =>
      ['SATURDAY', 'SUNDAY'].includes(e.day) ? e : { ...e, isAvailable: true, slots: defaultSlots() },
    ));
    toast.success('Mon-Fri set to 08:00 - 18:00');
  }
  function clearAll() {
    setEntries((prev) => prev.map((e) => ({ ...e, isAvailable: false, slots: [] })));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
      <p className="text-sm text-gray-500 mt-1">Set your working hours and online status</p>

      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Online status</div>
            <div className="text-sm text-gray-500">
              {isOnline && isAccepting
                ? 'You are visible and accepting jobs'
                : isOnline ? 'Online but not accepting jobs'
                : 'You are invisible to customers'}
            </div>
          </div>
          <button
            onClick={toggleStatus}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition flex-shrink-0',
              isOnline
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
            )}
          >
            {isOnline ? <Bell size={16} /> : <BellOff size={16} />}
            {isOnline ? 'Go offline' : 'Go online'}
          </button>
        </div>
      </Card>

      <Card className="p-6 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-semibold">Working hours</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add multiple time slots per day (e.g. 8-12 + 14-18).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={applyWeekdays}>Mon-Fri default</Button>
            <Button size="sm" variant="outline" onClick={clearAll}>Clear all</Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {entries.map((e) => (
            <DayRow
              key={e.day}
              entry={e}
              allEntries={entries}
              onToggle={(v) => updateEntry(e.day, { isAvailable: v })}
              onAddSlot={() => addSlot(e.day)}
              onRemoveSlot={(idx) => removeSlot(e.day, idx)}
              onUpdateSlot={(idx, patch) => updateSlot(e.day, idx, patch)}
              onCopyToAll={() => copyToAll(e.day)}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Spinner size={16} /> : 'Save hours'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function DayRow({
  entry, allEntries,
  onToggle, onAddSlot, onRemoveSlot, onUpdateSlot, onCopyToAll,
}: {
  entry: DayEntry;
  allEntries: DayEntry[];
  onToggle: (v: boolean) => void;
  onAddSlot: () => void;
  onRemoveSlot: (idx: number) => void;
  onUpdateSlot: (idx: number, patch: Partial<TimeSlot>) => void;
  onCopyToAll: () => void;
}) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={entry.isAvailable}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <div className="font-medium w-24">{DAY_LABELS[entry.day]}</div>
        <div className="text-xs text-gray-500 flex-1">
          {entry.isAvailable
            ? entry.slots.length === 0
              ? 'Available, no times set'
              : `${entry.slots.length} time slot${entry.slots.length > 1 ? 's' : ''}`
            : 'Closed'}
        </div>
        <button
          type="button"
          onClick={onCopyToAll}
          className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          title="Copy this day's hours to all days"
        >
          <Copy size={12} /> Copy to all
        </button>
      </div>
      {entry.isAvailable && (
        <div className="mt-2 space-y-2 pl-7">
          {entry.slots.map((s, i) => {
            const err = validateSlot(s, entry.day, allEntries);
            return (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={s.startTime}
                  onChange={(e) => onUpdateSlot(i, { startTime: e.target.value })}
                  className={clsx('px-2 py-1.5 border rounded-lg text-sm', err && 'border-red-400')}
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="time"
                  value={s.endTime}
                  onChange={(e) => onUpdateSlot(i, { endTime: e.target.value })}
                  className={clsx('px-2 py-1.5 border rounded-lg text-sm', err && 'border-red-400')}
                />
                {err && <span className="text-xs text-red-600 flex-1">{err}</span>}
                <button
                  type="button"
                  onClick={() => onRemoveSlot(i)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Remove slot"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          <Button size="sm" variant="outline" onClick={onAddSlot}>
            <Plus size={14} className="mr-1" /> Add time slot
          </Button>
        </div>
      )}
    </div>
  );
}