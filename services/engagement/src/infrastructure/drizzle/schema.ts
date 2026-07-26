import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
export { outboxEvents } from '@classifieds/outbox';

export const favorites = pgTable(
  'favorites',
  {
    userId: uuid('user_id').notNull(),
    listingId: uuid('listing_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.listingId] })],
);

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey(),
  listingId: uuid('listing_id').notNull(),
  userId: uuid('user_id').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const listingViews = pgTable('listing_views', {
  listingId: uuid('listing_id').primaryKey(),
  viewCount: integer('view_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type FavoriteRow = typeof favorites.$inferSelect;
export type NewFavoriteRow = typeof favorites.$inferInsert;
export type ResponseRow = typeof responses.$inferSelect;
export type NewResponseRow = typeof responses.$inferInsert;
export type ListingViewRow = typeof listingViews.$inferSelect;
