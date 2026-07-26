import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { search } from '../lib/api.js';
import type { SearchResultItem } from '../lib/types.js';

export function FeedPage() {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [minPriceCents, setMinPriceCents] = useState('');
  const [maxPriceCents, setMaxPriceCents] = useState('');
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e?: FormEvent): Promise<void> {
    e?.preventDefault();
    setError(null);
    try {
      const items = await search({
        text: text || undefined,
        category: category || undefined,
        minPriceCents: minPriceCents ? Number(minPriceCents) * 100 : undefined,
        maxPriceCents: maxPriceCents ? Number(maxPriceCents) * 100 : undefined,
      });
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'не удалось выполнить поиск');
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Лента / поиск</h1>
      <form onSubmit={runSearch} className="mb-6 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
          placeholder="Что ищем?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          className="w-32 rounded border border-slate-300 px-3 py-1.5 text-sm"
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className="w-28 rounded border border-slate-300 px-3 py-1.5 text-sm"
          placeholder="Цена от, ₽"
          type="number"
          value={minPriceCents}
          onChange={(e) => setMinPriceCents(e.target.value)}
        />
        <input
          className="w-28 rounded border border-slate-300 px-3 py-1.5 text-sm"
          placeholder="Цена до, ₽"
          type="number"
          value={maxPriceCents}
          onChange={(e) => setMaxPriceCents(e.target.value)}
        />
        <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white">
          Найти
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      {results === null ? (
        <p className="text-sm text-slate-500">Задайте параметры и нажмите «Найти» -- индекс строится асинхронно из
        событий `listing`, поэтому только что созданное объявление появится тут не сразу.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-slate-500">Ничего не найдено.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {results.map((item) => (
            <li key={item.id} className="p-4">
              <Link to={`/listings/${item.id}`} className="font-medium text-slate-900 hover:underline">
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{(item.priceCents / 100).toFixed(2)} ₽</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
