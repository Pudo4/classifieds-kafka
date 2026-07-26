import type { Favorite } from '../../domain/favorite.js';
import type { FavoriteRepositoryPort } from '../ports/favorite-repository.port.js';

export async function listMyFavorites(userId: string, repo: FavoriteRepositoryPort): Promise<Favorite[]> {
  return repo.listByUser(userId);
}
