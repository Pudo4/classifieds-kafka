import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
export { outboxEvents } from '@classifieds/outbox';

// No `processed_events` table here, unlike listing/moderation: media's
// idempotency guard is the asset's own `status` column (see
// application/use-cases/process-media.usecase.ts -- anything not
// `uploaded` short-circuits to 'skip'). A redelivered message that arrives
// after the terminal DB write already committed just finds a non-uploaded
// asset and does nothing; there's no separate ledger needed because the
// aggregate's state already answers "have I handled this".

// Duplicated from domain/media-asset.ts's MEDIA_STATUSES for the same
// drizzle-kit module-resolution reason documented in services/listing's
// schema.ts. Keep in sync -- domain/media-asset.test.ts exercises the full set.
const MEDIA_STATUS_VALUES = ['uploaded', 'ready', 'failed'] as const;
export const mediaStatusEnum = pgEnum('media_status', MEDIA_STATUS_VALUES);

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey(),
  listingId: uuid('listing_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  originalKey: text('original_key').notNull(),
  previewKey: text('preview_key'),
  status: mediaStatusEnum('status').notNull(),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRow = typeof mediaAssets.$inferInsert;
