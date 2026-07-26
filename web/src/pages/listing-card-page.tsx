import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addFavorite, getListingCard, listMyFavorites, mediaFileUrl, recordView, removeFavorite } from '../lib/api.js';
import { useCurrentUser } from '../hooks/current-user.js';
import { StatusBadge } from '../components/status-badge.js';
import type { ListingCard } from '../lib/types.js';

export function ListingCardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [card, setCard] = useState<ListingCard | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [nextCard, myFavorites] = await Promise.all([
        getListingCard(user.id, id),
        listMyFavorites(user.id),
      ]);
      setCard(nextCard);
      setIsFavorite(myFavorites.some((f) => f.listingId === id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'не удалось загрузить объявление');
    }
  }, [id, user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Recorded once per mount, not per render/refresh click -- refreshing the
  // card to see the media placeholder resolve shouldn't itself count as a
  // second view. Guarded by a ref, not just the effect dependency array:
  // React 18's <StrictMode> (see main.tsx) deliberately double-invokes
  // effects in dev (mount -> cleanup -> mount) to surface exactly this kind
  // of non-idempotent effect -- without the ref, one real page visit
  // recorded two views.
  const recordedViewForId = useRef<string | null>(null);
  useEffect(() => {
    if (id && recordedViewForId.current !== id) {
      recordedViewForId.current = id;
      void recordView(user.id, id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleFavorite(): Promise<void> {
    if (!id) return;
    if (isFavorite) {
      await removeFavorite(user.id, id);
    } else {
      await addFavorite(user.id, id);
    }
    await load();
  }

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!card) return <p className="text-sm text-slate-500">Загрузка…</p>;

  const { listing, media, counters } = card;
  const asset = media[0];

  return (
    <div className="rounded border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{listing.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{listing.category}</p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      {/* This is the phase-8 "media processing" moment: right after upload
          there's a `media` entry with status `uploaded`/`failed` but no
          `previewKey` yet -- show a placeholder instead of a broken <img>,
          and let the user click "Обновить" once processing has caught up
          (no polling, see README's "no polling except SSE" rule). */}
      <div className="mb-4">
        {!asset ? (
          <div className="flex h-56 w-full items-center justify-center rounded bg-slate-100 text-sm text-slate-400">
            без фото
          </div>
        ) : asset.previewKey ? (
          <img src={mediaFileUrl(asset.id)} alt={listing.title} className="h-56 w-full rounded object-cover" />
        ) : (
          <div className="flex h-56 w-full items-center justify-center rounded bg-slate-100 text-sm text-slate-400">
            {asset.status === 'failed' ? 'не удалось обработать фото' : 'обрабатывается…'}
          </div>
        )}
      </div>

      <p className="mb-4 whitespace-pre-wrap text-slate-700">{listing.description}</p>
      <p className="mb-4 text-lg font-semibold text-slate-900">{(listing.priceCents / 100).toFixed(2)} ₽</p>

      {listing.status === 'rejected' && listing.rejectionReason && (
        <p className="mb-4 rounded bg-rose-50 p-3 text-sm text-rose-700">Причина отклонения: {listing.rejectionReason}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>👁 {counters.viewCount}</span>
        <span>♥ {counters.favoriteCount}</span>
        <button
          type="button"
          onClick={() => void toggleFavorite()}
          className={`rounded border px-3 py-1 ${isFavorite ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-300 text-slate-700'}`}
        >
          {isFavorite ? 'В избранном' : 'В избранное'}
        </button>
        <button type="button" onClick={() => void load()} className="rounded border border-slate-300 px-3 py-1 text-slate-700">
          Обновить
        </button>
      </div>
    </div>
  );
}
