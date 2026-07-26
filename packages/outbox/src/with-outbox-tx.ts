import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outboxEvents, type NewOutboxEvent } from './schema.js';

/**
 * Db-or-transaction handle; every service's Drizzle setup uses `pg` +
 * `drizzle-orm/node-postgres`. Generic over the service's own schema
 * (rather than fixed to an empty one) because `NodePgDatabase`'s schema
 * parameter is invariant -- a service passing its real `NodePgDatabase<typeof
 * schema>` (or a transaction over it) wouldn't otherwise structurally match.
 */
export type OutboxDb<TSchema extends Record<string, unknown> = Record<string, never>> = NodePgDatabase<TSchema>;

export interface OutboxMessage {
  aggregateId: string;
  topic: string;
  eventKey: string;
  /** `null` is a deliberate tombstone -- relayed as a Kafka message with `value = null`. */
  payload: Record<string, unknown> | null;
}

/**
 * Call this inside the same `db.transaction(async (tx) => ...)` as the
 * business write it accompanies. That's what makes it atomic with the
 * write -- there is no separate "outbox service" or shared outbox
 * connection to coordinate with.
 */
export async function insertOutboxMessages<TSchema extends Record<string, unknown>>(
  tx: OutboxDb<TSchema>,
  messages: OutboxMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  const rows: NewOutboxEvent[] = messages.map((message) => ({
    aggregateId: message.aggregateId,
    topic: message.topic,
    eventKey: message.eventKey,
    payload: message.payload,
  }));
  await tx.insert(outboxEvents).values(rows);
}
