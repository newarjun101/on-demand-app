import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { BadgeCheck, Heart, MapPin, MessageCircle, Phone, Star, CalendarDays, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { workerApi, eventApi } from '@/api/endpoints';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Spinner, StarRating } from '@/components/UI';
import { formatMmk, resolveImageUrl } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi, favoriteApi } from '@/api/endpoints';

export function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const source = (searchParams.get('src') as 'boost' | 'search' | 'category' | 'home' | 'profile' | 'direct' | 'favorites' | 'requests' | 'recommendations' | null) ?? 'direct';
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', id],
    queryFn: () => workerApi.get(id!),
    enabled: !!id,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoriteApi.list,
    enabled: !!user,
  });
  const isFavorite = !!favorites?.find((f) => f.workerProfileId === id);

  // Log a "view_worker" event once per profile visit, with the source.
  useEffect(() => {
    if (!id) return;
    eventApi.log({ type: 'view_worker', workerId: id, source }).catch(() => {});
  }, [id, source]);

  const favMutation = useMutation({
    mutationFn: () => workerApi.favorite(id!),
    onSuccess: () => {
      toast.success('Added to favorites');
      eventApi.log({ type: 'favorite', workerId: id! }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const unfavMutation = useMutation({
    mutationFn: () => workerApi.unfavorite(id!),
    onSuccess: () => { toast.success('Removed from favorites'); queryClient.invalidateQueries({ queryKey: ['favorites'] }); },
  });

  const [chatLoading, setChatLoading] = useState(false);

  async function startChat() {
    if (!user) { navigate('/login'); return; }
    setChatLoading(true);
    try {
      if (!worker) return;
      const conv = await chatApi.openConversation({ recipientId: worker.user.id });
      navigate(`/messages/${conv.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Could not start chat');
    } finally {
      setChatLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-40 mb-6" />
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (!worker) return <EmptyState title="Worker not found" />;

  const reviews = worker.user.reviewsReceived ?? [];
  const isVerified = worker.verificationStatus === 'APPROVED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <Card className="overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-200" />
        <div className="p-6 flex flex-col sm:flex-row gap-6 sm:items-end -mt-16">
          <div className="flex-shrink-0">
            <Avatar src={worker.user.avatarUrl} name={worker.user.fullName} size={120} />
          </div>
          <div className="flex-1 pt-4 sm:pt-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{worker.user.fullName}</h1>
              {isVerified && <BadgeCheck size={20} className="text-brand-600" />}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <StarRating value={worker.ratingAverage} />
              <span className="font-medium">{worker.ratingAverage.toFixed(1)}</span>
              <span className="text-gray-400">({worker.ratingCount} reviews)</span>
              <span className="text-gray-400">·</span>
              <span>{worker.completedJobs} jobs</span>
              <span className="text-gray-400">·</span>
              <span>{worker.experienceYears}y experience</span>
            </div>
            {worker.city && (
              <div className="mt-2 text-gray-500 inline-flex items-center gap-1">
                <MapPin size={14} /> {worker.city} · {worker.serviceRadiusKm} km service area
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {isVerified && <Badge color="green">Verified</Badge>}
              {worker.emergencyAvailable && <Badge color="red">24/7 Emergency</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/request/create?workerId=${worker.id}`}>
              <Button>
                <Wrench size={16} className="mr-2" /> Request Service
              </Button>
            </Link>
            <Button variant="outline" onClick={startChat} disabled={chatLoading}>
              {chatLoading ? <Spinner size={16} /> : <MessageCircle size={16} className="mr-2" />}
              Chat
            </Button>
            {user && (
              isFavorite ? (
                <Button variant="outline" onClick={() => unfavMutation.mutate()}>
                  <Heart size={16} className="mr-2 fill-current text-red-500" /> Saved
                </Button>
              ) : (
                <Button variant="outline" onClick={() => favMutation.mutate()}>
                  <Heart size={16} className="mr-2" /> Save
                </Button>
              )
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{worker.bio ?? 'This worker has not added a bio yet.'}</p>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Services & Pricing</h2>
            <div className="space-y-3">
              {worker.services.map((s) => {
                const price =
                  s.pricingType === 'FIXED' ? s.fixedPrice :
                  s.pricingType === 'HOURLY' ? s.hourlyRate :
                  s.startingPrice;
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{s.service.name}</div>
                      <div className="text-xs text-gray-500">{s.service.category?.name}</div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">{s.pricingType.replace('_', ' ').toLowerCase()}{s.estimatedMinutes ? ` · ~${s.estimatedMinutes} min` : ''}</div>
                    </div>
                    <div className="font-semibold text-gray-900">{formatMmk(price)}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {worker.portfolio.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {worker.portfolio.map((img) => {
                  const url = resolveImageUrl(img.imageUrl);
                  return url ? (
                    <img
                      key={img.id}
                      src={url}
                      alt=""
                      className="aspect-square object-cover rounded-lg bg-gray-100"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : null;
                })}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Reviews ({worker.user._count.reviewsReceived})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Avatar src={r.author.avatarUrl} name={r.author.fullName} size={32} />
                      <div>
                        <div className="font-medium text-sm">{r.author.fullName}</div>
                        <div className="text-xs text-gray-500">{r.booking.request.service.name}</div>
                      </div>
                      <div className="ml-auto flex items-center">
                        <StarRating value={r.rating} />
                      </div>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Quick info</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Member since</span><span>{new Date(worker.user.createdAt).getFullYear()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Service radius</span><span>{worker.serviceRadiusKm} km</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Completed jobs</span><span>{worker.completedJobs}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge color={worker.emergencyAvailable ? 'red' : 'gray'}>{worker.emergencyAvailable ? '24/7' : 'By schedule'}</Badge></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}