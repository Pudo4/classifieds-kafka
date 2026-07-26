import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
// Same reasoning as services/listing/.../schema.ts: shared table shapes
// re-exported here so drizzle-kit generates migrations for all three
// tables from this one schema file, and so this service's own
// `drizzle/` folder is the single source of truth for its whole database.
export { outboxEvents } from '@classifieds/outbox';
export { processedEvents } from '@classifieds/idempotency';

// Duplicated from @classifieds/contracts's moderationVerdictSchema values
// rather than imported, for the same drizzle-kit module-resolution reason
// documented in services/listing's schema.ts.
const MODERATION_VERDICT_VALUES = ['approved', 'rejected'] as const;
export const moderationVerdictEnum = pgEnum('moderation_verdict', MODERATION_VERDICT_VALUES);

export const moderationDecisions = pgTable('moderation_decisions', {
  id: uuid('id').primaryKey(),
  listingId: uuid('listing_id').notNull(),
  verdict: moderationVerdictEnum('verdict').notNull(),
  reason: text('reason'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull(),
});

export type ModerationDecisionRow = typeof moderationDecisions.$inferSelect;
export type NewModerationDecisionRow = typeof moderationDecisions.$inferInsert;
