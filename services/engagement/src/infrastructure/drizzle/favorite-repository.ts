import { and, count, eq } from 'drizzle-orm';
import { insertOutboxMessages } from '@classifieds/outbox';
import type { Favorite } from '../../domain/favorite.js';
import type { FavoriteRepositoryPort } from '../../application/ports/favorite-repository.port.js';
import type { Db } from './db.js';
import { favorites, type FavoriteRow } from './schema.js';
import { mapFavoriteToOutboxMessage } from './engagement-event.mapper.js';

function toFavorite(row: FavoriteRow): Favorite {
  return { userId: row.userId, listingId: row.listingId, createdAt: row.createdAt };
}

export class DrizzleFavoriteRepository implements FavoriteRepositoryPort {
  constructor(private readonly db: Db) {}

  async findOne(userId: string, listingId: string): Promise<Favorite | null> {
    const [row] = await this.db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
      .limit(1);
    return row ? toFavorite(row) : null;
  }

  async add(favorite: Favorite): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(favorites).values(favorite);
      await insertOutboxMessages(tx, [mapFavoriteToOutboxMessage('favorited', favorite)]);
    });
  }

  async remove(userId: string, listingId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const deletedRows = await tx
        .delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
        .returning();
      const [row] = deletedRows;
      if (!row) return false;
      await insertOutboxMessages(tx, [mapFavoriteToOutboxMessage('unfavorited', toFavorite(row))]);
      return true;
    });
  }

  async listByUser(userId: string): Promise<Favorite[]> {
    const rows = await this.db.select().from(favorites).where(eq(favorites.userId, userId));
    return rows.map(toFavorite);
  }

  async countByListing(listingId: string): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(favorites).where(eq(favorites.listingId, listingId));
    return row?.value ?? 0;
  }
}
