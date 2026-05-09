import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { GridCard } from '../components/GridCard';
import { TabBar } from '../components/TabBar';
import type { Grid } from '../types/api';

type FeedGrid = Grid & { _count: { comments: number; likes: number } };

export function FeedPage() {
  const me = useAuthStore(s => s.user);
  const { t } = useTranslation();
  const [grids, setGrids] = useState<FeedGrid[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset = false, fo = friendsOnly) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fo) params.set('friendsOnly', 'true');
      if (!reset && cursor) params.set('cursor', cursor);
      const { data } = await api.get<{ grids: FeedGrid[]; nextCursor: string | null }>(
        `/grids/feed?${params}`
      );
      setGrids(prev => reset ? data.grids : [...prev, ...data.grids]);
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, friendsOnly]);

  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    setGrids([]);
    load(true, friendsOnly);
  }, [friendsOnly]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) load(false, friendsOnly);
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, load, friendsOnly]);

  const filters = [
    { label: t('feed.all'), value: false },
    { label: t('feed.friends'), value: true },
  ];

  return (
    <div className="ch-screen ch-app" style={{ minHeight: '100vh' }}>
      <div className="ch-scroll" style={{ paddingBottom: 100 }}>
        <div className="feed__header">
          <span className="ch-serif feed__title">{t('feed.title')}</span>
        </div>

        <div className="feed__filters">
          {filters.map(opt => (
            <button
              key={opt.label}
              onClick={() => setFriendsOnly(opt.value)}
              className={`feed__filter-btn feed__filter-btn--${friendsOnly === opt.value ? 'active' : 'inactive'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="feed__list">
          {grids.map(g => <GridCard key={g.id} grid={g} currentUserId={me?.id} />)}
        </div>

        <div ref={loaderRef} className="feed__loader">
          {loading && (
            <div className="feed__loader-dots">
              {[0, 1, 2].map(i => (
                <div key={i} className="feed__loader-dot" style={{ opacity: 0.35 + i * 0.2 }} />
              ))}
            </div>
          )}
          {!hasMore && grids.length > 0 && (
            <span className="feed__end-label">{t('feed.loadMore')}</span>
          )}
          {!loading && grids.length === 0 && (
            <div className="ch-card feed__empty">
              {friendsOnly ? t('feed.emptyFriends') : t('feed.emptyAll')}
            </div>
          )}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
