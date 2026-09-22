import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Star, Zap } from 'lucide-react';
import { Avatar, Badge, StarRating } from '@/components/UI';
import { WorkerCardData } from '@/types';
import { formatMmk, resolveImageUrl } from '@/utils/format';

export function WorkerCard({ worker, source }: { worker: WorkerCardData; source?: string }) {
  const cover = resolveImageUrl(worker.portfolio[0]);
  const href = source ? `/workers/${worker.id}?src=${source}` : `/workers/${worker.id}`;
  return (
    <Link
      to={href}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-brand-300 hover:shadow-lg transition overflow-hidden flex flex-col"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-brand-50 to-brand-100 relative">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-300 text-4xl font-semibold">
            {worker.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </div>
        )}
        {worker.emergencyAvailable && (
          <span className="absolute top-3 right-3"><Badge color="red">24/7</Badge></span>
        )}
        {worker.boosted && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
            <Zap size={12} fill="currentColor" /> Boosted
          </span>
        )}
        {worker.verified && !worker.boosted && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-xs text-brand-700 font-medium px-2 py-1 rounded-full">
            <BadgeCheck size={14} className="text-brand-600" /> Verified
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex">
        <div className="flex gap-3 w-full">
          <Avatar src={worker.avatarUrl} name={worker.name} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{worker.name}</h3>
              {worker.distanceKm != null && (
                <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                  <MapPin size={12} /> {worker.distanceKm < 1 ? '<1' : worker.distanceKm.toFixed(1)} km
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-600">
              <StarRating value={worker.ratingAverage} />
              <span className="font-medium">{worker.ratingAverage.toFixed(1)}</span>
              <span className="text-gray-400">({worker.ratingCount})</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {worker.services.slice(0, 3).map((s) => (
                <Badge key={s.id} color="gray">{s.name}</Badge>
              ))}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="text-xs text-gray-500">
                {worker.experienceYears}y experience · {worker.completedJobs} jobs
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Starting from</div>
                <div className="font-semibold text-gray-900">{formatMmk(worker.startingPrice)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}