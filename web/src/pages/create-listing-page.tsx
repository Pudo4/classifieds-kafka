import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createListing, submitListing, uploadMedia } from '../lib/api.js';
import { useCurrentUser } from '../hooks/current-user.js';

export function CreateListingPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceRub, setPriceRub] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const listing = await createListing(user.id, {
        title,
        description,
        priceCents: Math.round(Number(priceRub) * 100),
        category,
      });
      if (file) {
        await uploadMedia(user.id, listing.id, file);
      }
      await submitListing(user.id, listing.id);
      navigate('/mine');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'не удалось создать объявление');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Создать объявление</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="flex max-w-lg flex-col gap-3">
        <label className="text-sm text-slate-700">
          Заголовок
          <input
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-700">
          Описание
          <textarea
            required
            rows={4}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-700">
          Цена, ₽
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            value={priceRub}
            onChange={(e) => setPriceRub(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-700">
          Категория
          <input
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-700">
          Фото (необязательно)
          <input
            type="file"
            accept="image/*"
            className="mt-1 block text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Отправляем…' : 'Отправить на модерацию'}
        </button>
      </form>
    </div>
  );
}
