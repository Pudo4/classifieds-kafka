import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
// No `outboxEvents` here -- unlike every other service so far, notification
// doesn't produce anything to Kafka. It's a pure sink: consume
// notification.requests.v1, store history, push to whoever's listening.
export { processedEvents } from '@classifieds/idempotency';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
