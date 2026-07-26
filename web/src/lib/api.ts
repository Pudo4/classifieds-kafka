import { BFF_BASE_URL } from './config.js';
import type {
  FavoriteSummary,
  ListingCard,
  ListingSummary,
  NotificationSummary,
  SearchResultItem,
} from './types.js';

export class ApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  userId?: string;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.userId) headers['X-User-Id'] = options.userId;
  // `null`, not `undefined`: fetch's `RequestInit.body` is `BodyInit | null`,
  // and `exactOptionalPropertyTypes` rejects `undefined` against that type.
  let body: string | null = null;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(new URL(path, BFF_BASE_URL), { method: options.method ?? 'GET', headers, body });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, text || `${options.method ?? 'GET'} ${path} failed with ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function createListing(
  userId: string,
  body: { title: string; description: string; priceCents: number; category: string },
): Promise<ListingSummary> {
  return request('/listings', { method: 'POST', userId, body });
}

export function submitListing(userId: string, listingId: string): Promise<ListingSummary> {
  return request(`/listings/${listingId}/submit`, { method: 'POST', userId });
}

export function archiveListing(userId: string, listingId: string): Promise<ListingSummary> {
  return request(`/listings/${listingId}/archive`, { method: 'POST', userId });
}

export function listMyListings(userId: string): Promise<ListingSummary[]> {
  return request('/listings/mine', { userId });
}

export function getListingCard(userId: string, listingId: string): Promise<ListingCard> {
  return request(`/listings/${listingId}/card`, { userId });
}

export function search(query: {
  text?: string | undefined;
  category?: string | undefined;
  minPriceCents?: number | undefined;
  maxPriceCents?: number | undefined;
}): Promise<SearchResultItem[]> {
  const params = new URLSearchParams();
  if (query.text) params.set('q', query.text);
  if (query.category) params.set('category', query.category);
  if (query.minPriceCents !== undefined) params.set('minPriceCents', String(query.minPriceCents));
  if (query.maxPriceCents !== undefined) params.set('maxPriceCents', String(query.maxPriceCents));
  const qs = params.toString();
  return request(`/search${qs ? `?${qs}` : ''}`);
}

export async function uploadMedia(userId: string, listingId: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('listingId', listingId);
  form.append('file', file);
  const response = await fetch(new URL('/media', BFF_BASE_URL), {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: form,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, text || `media upload failed with ${response.status}`);
  }
}

export function mediaFileUrl(mediaId: string): string {
  return new URL(`/media/${mediaId}/file`, BFF_BASE_URL).toString();
}

export function addFavorite(userId: string, listingId: string): Promise<FavoriteSummary> {
  return request('/favorites', { method: 'POST', userId, body: { listingId } });
}

export function removeFavorite(userId: string, listingId: string): Promise<void> {
  return request(`/favorites/${listingId}`, { method: 'DELETE', userId });
}

export function listMyFavorites(userId: string): Promise<FavoriteSummary[]> {
  return request('/favorites/mine', { userId });
}

export function recordView(userId: string, listingId: string): Promise<void> {
  return request(`/views/${listingId}`, { method: 'POST', userId });
}

export function listNotifications(userId: string): Promise<NotificationSummary[]> {
  return request('/notifications', { userId });
}
