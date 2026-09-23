import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { favoriteApi } from '@/api/endpoints';
import { Button, Card, EmptyState, Skeleton } from '@/components/UI';
import { Avatar, StarRating } from '@/components/UI';
import { Pagination } from '@/components/Pagination';
import { formatMmk } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

export function FavoritesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () => favoriteApi.list(), // backend doesn't paginate favorites; if it did, add (page, PAGE_SIZE)
  });

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState title="Log in to see your favorites" action={<Link to="/login" className="text-brand-700">Log in</Link>} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Favorite workers</h1>
      <p className="text-sm text-gray-500 mt-1">Workers you've saved</p>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No favorites yet"
            description="Save workers you like for quick access."
            action={<Link to="/services" className="text-brand-700">Browse workers</Link>}
          />
        ) : (
          data!.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((f) => (
            <Card key={f.id} className="p-4 flex items-center gap-3">
              <Avatar src={f.workerProfile.user.avatarUrl} name={f.workerProfile.user.fullName} size={48} />
              <div className="flex-1 min-w-0">
                <Link to={`/workers/${f.workerProfileId}`} className="font-semibold hover:underline">
                  {f.workerProfile.user.fullName}
                </Link>
                <div className="flex flex-wrap gap-1 mt-1">
                  {f.workerProfile.services.slice(0, 3).map((s) => (
                    <span key={s.service.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{s.service.name}</span>
                  ))}
                </div>
              </div>
              <Link to={`/workers/${f.workerProfileId}`}>
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </Card>
          ))
        )}
      </div>
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.length} onChange={setPage} />}
    </div>
  );
}
