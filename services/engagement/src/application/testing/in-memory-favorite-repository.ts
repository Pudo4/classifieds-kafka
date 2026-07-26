import type { Favorite } from '../../domain/favorite.js';
import type { FavoriteRepositoryPort } from '../ports/favorite-repository.port.js';

function key(userId: string, listingId: string): string {
  return `${userId}:${listingId}`;
}

export class InMemoryFavoriteRepository implements FavoriteRepositoryPort {
  private readonly store = new Map<string, Favorite>();
  readonly publishedEvents: Array<{ type: 'favorited' | 'unfavorited'; favorite: Favorite }> = [];

  async findOne(userId: string, listingId: string): Promise<Favorite | null> {
    return this.store.get(key(userId, listingId)) ?? null;
  }

  async add(favorite: Favorite): Promise<void> {
    this.store.set(key(favorite.userId, favorite.listingId), favorite);
    this.publishedEvents.push({ type: 'favorited', favorite });
  }

  async remove(userId: string, listingId: string): Promise<boolean> {
    const existing = this.store.get(key(userId, listingId));
    if (!existing) return false;
    this.store.delete(key(userId, listingId));
    this.publishedEvents.push({ type: 'unfavorited', favorite: existing });
    return true;
  }

  async listByUser(userId: string): Promise<Favorite[]> {
    return [...this.store.values()].filter((f) => f.userId === userId);
  }

  async countByListing(listingId: string): Promise<number> {
    return [...this.store.values()].filter((f) => f.listingId === listingId).length;
  }
}
