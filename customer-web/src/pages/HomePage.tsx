import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { categoryApi, workerApi, recommendationsApi, eventApi } from '@/api/endpoints';
import { WorkerCard } from '@/components/WorkerCard';
import { Button, Card, EmptyState, Skeleton, Spinner } from '@/components/UI';
import { useI18n } from '@/i18n';

export function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  });

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ['home-workers'],
    queryFn: () => workerApi.search({ pageSize: 8, sort: 'RECOMMENDED' }),
  });

  // Personalised recommendations — only for logged-in customers with some history
  const { data: recs, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.list({ pageSize: 8 }),
    enabled: !!user,
  });

  // Log a "view_category" event when the home page loads (helps boost the
  // worker's category match score for future recommendations).
  useEffect(() => {
    if (user) {
      eventApi.log({ type: 'view_category', categorySlug: 'all', source: 'home' }).catch(() => {});
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doSearch() {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (city) params.set('city', city);
    navigate(`/services?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-brand-100">
              {t('home.heroSubtitle')}
            </p>
            <Card className="mt-8 p-3 sm:p-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="flex items-center gap-2 px-2 flex-1">
                <Search className="text-gray-400" size={18} />
                <input
                  className="flex-1 outline-none py-2 text-sm"
                  placeholder={t('home.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                />
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-2 px-2 flex-1">
                <MapPin className="text-gray-400" size={18} />
                <input
                  className="flex-1 outline-none py-2 text-sm"
                  placeholder={t('home.cityPlaceholder')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                />
              </div>
              <Button onClick={doSearch} className="w-full sm:w-auto">{t('home.findWorkers')}</Button>
            </Card>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              <span className="text-brand-100">{t('common.popular')}:</span>
              {(categories?.[0]?.services ?? []).slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition"
                  onClick={() => navigate(`/services?service=${s.slug}`)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('home.popularCategories')}</h2>
        </div>
        {catsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(categories ?? []).flatMap((c) => c.services.slice(0, 2)).map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/services?service=${s.slug}`)}
                className="p-4 bg-white border border-gray-100 hover:border-brand-300 hover:shadow rounded-xl text-left transition"
              >
                <div className="text-2xl">🔧</div>
                <div className="mt-2 font-medium text-gray-900 text-sm">{s.name}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Recommended for you — only for logged-in customers */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" /> {t('home.recommended')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{t('home.recommendedSubtitle')}</p>
            </div>
          </div>
          {recsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border p-4">
                  <Skeleton className="aspect-[16/9] mb-3" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (recs?.items.length ?? 0) === 0 ? (
            <Card className="p-6 text-center text-sm text-gray-500">
              {t('home.noRecommendations')}
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recs!.items.map((w) => {
                const isBoosted = (w as any).boosted;
                const src = isBoosted ? 'boost' : 'recommendations';
                return <WorkerCard key={w.id} worker={w} source={src} />;
              })}
            </div>
          )}
        </section>
      )}

      {/* Popular workers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('home.topRatedWorkers')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('home.topRatedSubtitle')}</p>
          </div>
          <Link to="/services" className="text-sm text-brand-700 hover:underline inline-flex items-center gap-1">
            See all <ArrowRight size={14} />
          </Link>
        </div>
        {workersLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                <Skeleton className="aspect-[16/9] mb-3" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (workers?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No workers available yet"
            description="Check back soon — new workers join every day."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workers!.items.map((w) => {
              const isBoosted = (w as any).boosted;
              const src = isBoosted ? 'boost' : 'home';
              return <WorkerCard key={w.id} worker={w} source={src} />;
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8 text-center">{t('home.howItWorks')}</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: t('home.step1Title'), desc: t('home.step1Desc') },
              { title: t('home.step2Title'), desc: t('home.step2Desc') },
              { title: t('home.step3Title'), desc: t('home.step3Desc') },
              { title: t('home.step4Title'), desc: t('home.step4Desc') },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-bold text-lg flex items-center justify-center mx-auto">{i + 1}</div>
                <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}