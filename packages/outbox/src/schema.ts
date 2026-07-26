import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Shared table shape, imported into each service's own Drizzle schema and
 * migrated via that service's own `drizzle/` folder -- there is no shared
 * outbox database, only a shared table definition (see monorepo rule: one
 * DB per service, no exceptions).
 */
export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  aggregateId: text('aggregate_id').notNull(),
  topic: text('topic').notNull(),
  eventKey: text('event_key').notNull(),
  // Nullable on purpose: a null payload becomes a real Kafka tombstone
  // (`value = null`) when relayed, not a JSON "deleted: true" sentinel --
  // see packages/contracts's compacted-topic convention.
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export type NewOutboxEvent = typeof outboxEvents.$inferInsert;
export type OutboxEventRow = typeof outboxEvents.$inferSelect;
