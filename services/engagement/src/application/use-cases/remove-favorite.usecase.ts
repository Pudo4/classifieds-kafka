import type { FavoriteRepositoryPort } from '../ports/favorite-repository.port.js';

/** Idempotent: removing a non-existent favorite is a no-op, not an error. */
export async function removeFavorite(userId: string, listingId: string, repo: FavoriteRepositoryPort): Promise<void> {
  await repo.remove(userId, listingId);
}
