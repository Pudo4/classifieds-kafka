import { eq, sql } from 'drizzle-orm';
import { insertOutboxMessages } from '@classifieds/outbox';
import type { ViewBatch } from '../../domain/view-batch.js';
import type { ViewRepositoryPort } from '../../application/ports/view-repository.port.js';
import type { Db } from './db.js';
import { listingViews } from './schema.js';
import { mapViewBatchToOutboxMessage } from './engagement-event.mapper.js';

export class DrizzleViewRepository implements ViewRepositoryPort {
  constructor(private readonly db: Db) {}

  /** One transaction for the whole flush cycle: every listing's count update plus every outbox row, atomic together. */
  async applyBatches(batches: ViewBatch[]): Promise<void> {
    if (batches.length === 0) return;

    await this.db.transaction(async (tx) => {
      for (const batch of batches) {
        await tx
          .insert(listingViews)
          .values({ listingId: batch.listingId, viewCount: batch.incrementBy, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: listingViews.listingId,
            set: { viewCount: sql`${listingViews.viewCount} + ${batch.incrementBy}`, updatedAt: new Date() },
          });
      }
      await insertOutboxMessages(tx, batches.map(mapViewBatchToOutboxMessage));
    });
  }

  async getViewCount(listingId: string): Promise<number> {
    const [row] = await this.db.select().from(listingViews).where(eq(listingViews.listingId, listingId)).limit(1);
    return row?.viewCount ?? 0;
  }
}
