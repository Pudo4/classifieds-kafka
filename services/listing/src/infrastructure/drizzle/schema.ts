import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
// Re-exported so drizzle-kit sees both tables from this one schema file and
// generates migrations for the outbox table alongside `listings` -- there
// is no separate outbox database, just a shared table shape (see
// packages/outbox).
export { outboxEvents } from '@classifieds/outbox';
export { processedEvents } from '@classifieds/idempotency';

// Duplicated from domain/listing.entity.ts's LISTING_STATUSES rather than
// imported: drizzle-kit loads this file through its own CJS/esbuild
// transform, which can't resolve this project's NodeNext-style relative
// `.js` imports back into the source tree. pgEnum also needs a literal
// tuple at this call site, so it can't be a re-export either way. Keep in
// sync with LISTING_STATUSES -- domain/listing.entity.test.ts asserts the
// full set, so a mismatch shows up there.
const LISTING_STATUS_VALUES = ['draft', 'pending', 'active', 'rejected', 'archived'] as const;

export const listingStatusEnum = pgEnum('listing_status', LISTING_STATUS_VALUES);

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey(),
  ownerId: uuid('owner_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  category: text('category').notNull(),
  status: listingStatusEnum('status').notNull(),
  rejectionReason: text('rejection_reason'),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type ListingRow = typeof listings.$inferSelect;
export type NewListingRow = typeof listings.$inferInsert;
