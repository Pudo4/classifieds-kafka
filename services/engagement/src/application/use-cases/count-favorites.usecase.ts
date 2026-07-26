import type { FavoriteRepositoryPort } from '../ports/favorite-repository.port.js';

export async function countFavorites(listingId: string, repo: FavoriteRepositoryPort): Promise<number> {
  return repo.countByListing(listingId);
}
