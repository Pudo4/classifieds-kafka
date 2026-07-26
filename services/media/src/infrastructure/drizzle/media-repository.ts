import { eq } from 'drizzle-orm';
import { insertOutboxMessages } from '@classifieds/outbox';
import { MediaAsset, type MediaAssetProps } from '../../domain/media-asset.js';
import type { MediaRepositoryPort } from '../../application/ports/media-repository.port.js';
import type { Db } from './db.js';
import { mediaAssets, type MediaAssetRow, type NewMediaAssetRow } from './schema.js';
import { mapMediaDomainEventToOutboxMessage } from './media-event.mapper.js';

function toRow(props: MediaAssetProps): NewMediaAssetRow {
  return {
    id: props.id,
    listingId: props.listingId,
    ownerId: props.ownerId,
    originalKey: props.originalKey,
    previewKey: props.previewKey,
    status: props.status,
    failureReason: props.failureReason,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}

function toProps(row: MediaAssetRow): MediaAssetProps {
  return {
    id: row.id,
    listingId: row.listingId,
    ownerId: row.ownerId,
    originalKey: row.originalKey,
    previewKey: row.previewKey,
    status: row.status,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMediaRepository implements MediaRepositoryPort {
  constructor(private readonly db: Db) {}

  async save(asset: MediaAsset): Promise<void> {
    const events = asset.pullDomainEvents();
    const row = toRow(asset.toSnapshot());
    const outboxMessages = events.map(mapMediaDomainEventToOutboxMessage);

    await this.db.transaction(async (tx) => {
      await tx.insert(mediaAssets).values(row).onConflictDoUpdate({ target: mediaAssets.id, set: row });
      await insertOutboxMessages(tx, outboxMessages);
    });
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const [row] = await this.db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    return row ? MediaAsset.fromPersistence(toProps(row)) : null;
  }

  async findByListing(listingId: string): Promise<MediaAsset[]> {
    const rows = await this.db.select().from(mediaAssets).where(eq(mediaAssets.listingId, listingId));
    return rows.map((row) => MediaAsset.fromPersistence(toProps(row)));
  }
}
