import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { archiveListing, listMyListings } from '../lib/api.js';
import { useCurrentUser } from '../hooks/current-user.js';
import { StatusBadge } from '../components/status-badge.js';
import type { ListingSummary } from '../lib/types.js';

export function MyListingsPage() {
  const { user } = useCurrentUser();
  const [listings, setListings] = useState<ListingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setListings(await listMyListings(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'не удалось загрузить объявления');
    }
  }, [user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function archive(id: string): Promise<void> {
    await archiveListing(user.id, id);
    await load();
  }

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!listings) return <p className="text-sm text-slate-500">Загрузка…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Мои объявления</h1>
        <button type="button" onClick={() => void load()} className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700">
          Обновить
        </button>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет объявлений.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {listings.map((listing) => (
            <li key={listing.id} className="flex items-center justify-between p-4">
              <div>
                <Link to={`/listings/${listing.id}`} className="font-medium text-slate-900 hover:underline">
                  {listing.title}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={listing.status} />
                  {listing.status === 'rejected' && listing.rejectionReason && (
                    <span className="text-xs text-rose-600">{listing.rejectionReason}</span>
                  )}
                </div>
              </div>
              {listing.status === 'active' && (
                <button
                  type="button"
                  onClick={() => void archive(listing.id)}
                  className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700"
                >
                  В архив
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
