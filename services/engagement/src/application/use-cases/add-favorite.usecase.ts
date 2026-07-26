import type { Favorite } from '../../domain/favorite.js';
import type { FavoriteRepositoryPort } from '../ports/favorite-repository.port.js';

export interface AddFavoriteInput {
  userId: string;
  listingId: string;
}

/** Idempotent: favoriting something already favorited just returns the existing row, no error. */
export async function addFavorite(input: AddFavoriteInput, repo: FavoriteRepositoryPort): Promise<Favorite> {
  const existing = await repo.findOne(input.userId, input.listingId);
  if (existing) return existing;

  const favorite: Favorite = { userId: input.userId, listingId: input.listingId, createdAt: new Date() };
  await repo.add(favorite);
  return favorite;
}
