import type { Favorite } from '../../domain/favorite.js';

export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');

export interface FavoriteRepositoryPort {
  findOne(userId: string, listingId: string): Promise<Favorite | null>;
  /** Creates the row and its outbox event atomically. */
  add(favorite: Favorite): Promise<void>;
  /** Deletes the row and writes the outbox event atomically. Returns whether a row actually existed. */
  remove(userId: string, listingId: string): Promise<boolean>;
  listByUser(userId: string): Promise<Favorite[]>;
  countByListing(listingId: string): Promise<number>;
}
