import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Shared table shape, imported into each service's own Drizzle schema and
 * migrated via that service's own `drizzle/` folder -- same convention as
 * `@classifieds/outbox`'s `outboxEvents`. The primary key on
 * (consumerGroup, eventId) is what makes claiming an event exactly-once
 * enforced by Postgres, not by consumer-side discipline.
 */
export const processedEvents = pgTable(
  'processed_events',
  {
    consumerGroup: text('consumer_group').notNull(),
    eventId: text('event_id').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.consumerGroup, table.eventId] })],
);

export type NewProcessedEvent = typeof processedEvents.$inferInsert;
