import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatDate, sameDay, startOfWeek } from '@/utils/format';
import { bookingApi, workerApi } from '@/api/endpoints';
import { Card } from '@/components/UI';
import { Badge } from '@/components/UI';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage() {
  const { profile } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek());
  const { data: jobs, isLoading } = useQuery({ queryKey: ['jobs'], queryFn: () => bookingApi.listJobs(1, 100) });

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const availability = (profile as any)?.availability ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium">Week of {weekStart.toLocaleDateString()}</span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div key={d.toISOString()} className="text-center text-xs font-medium text-gray-500">{DAYS[d.getDay()]} {d.getDate()}</div>
        ))}
        {days.map((d) => {
          const dayJobs = (jobs?.items ?? []).filter((j) => j.scheduledAt && sameDay(new Date(j.scheduledAt), d));
          const dayAvail = availability.find((a: any) => a.day === ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][d.getDay()]);
          return (
            <Card key={d.toISOString()} className="p-2 min-h-[140px]">
              <div className={clsx('text-xs', sameDay(d, new Date()) && 'text-brand-700 font-semibold')}>
                {d.getDate()}
              </div>
              {dayAvail && dayAvail.isAvailable && (
                <div className="mt-1 text-[10px] text-gray-500">{dayAvail.startTime}–{dayAvail.endTime}</div>
              )}
              {dayJobs.length === 0 ? (
                <div className="mt-2 text-[10px] text-gray-300">No jobs</div>
              ) : (
                <div className="mt-2 space-y-1">
                  {dayJobs.slice(0, 3).map((j) => (
                    <a key={j.id} href={`/jobs/${j.id}`} className="block bg-brand-50 text-brand-800 px-1.5 py-1 rounded text-[10px] truncate hover:bg-brand-100">
                      {new Date(j.scheduledAt!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {j.request?.service.name}
                    </a>
                  ))}
                  {dayJobs.length > 3 && <div className="text-[10px] text-gray-500">+{dayJobs.length - 3} more</div>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-6 mt-6">
        <h2 className="font-semibold mb-3">Working hours</h2>
        <p className="text-sm text-gray-500">Manage your availability in the <a href="/availability" className="text-brand-700 hover:underline">availability page</a>.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {availability.map((a: any) => (
            <div key={a.day} className="flex justify-between p-2 border rounded">
              <span className="font-medium">{a.day}</span>
              <span>{a.isAvailable ? `${a.startTime} – ${a.endTime}` : 'Unavailable'}</span>
            </div>
          ))}
          {availability.length === 0 && <p className="text-sm text-gray-500">No availability set. <a href="/availability" className="text-brand-700 hover:underline">Set hours</a></p>}
        </div>
      </Card>
    </div>
  );
}