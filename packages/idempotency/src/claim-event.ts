import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { processedEvents } from './schema.js';

/** Generic over the service's own schema for the same reason as `@classifieds/outbox`'s `OutboxDb`. */
export type IdempotencyDb<TSchema extends Record<string, unknown> = Record<string, never>> = NodePgDatabase<TSchema>;

const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && Reflect.get(error, 'code') === POSTGRES_UNIQUE_VIOLATION;
}

/**
 * Call inside `db.transaction(async (tx) => ...)`, before the business
 * work, and only do that work if this returns `true`. The insert racing
 * against the table's primary key is what makes "have I already handled
 * this event" atomic with "handle it" -- a duplicate delivery hits a
 * unique-violation and this returns `false` instead of throwing.
 *
 * The claim attempt runs in a nested transaction (a Postgres SAVEPOINT):
 * once any statement in a Postgres transaction errors, the whole
 * transaction is aborted and every later statement fails too, even if the
 * JS exception is caught -- without the savepoint, the business work that
 * follows in the *outer* transaction would be unable to commit.
 */
export async function claimEvent<TSchema extends Record<string, unknown>>(
  tx: IdempotencyDb<TSchema>,
  consumerGroup: string,
  eventId: string,
): Promise<boolean> {
  try {
    await tx.transaction(async (savepoint) => {
      await savepoint.insert(processedEvents).values({ consumerGroup, eventId });
    });
    return true;
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
}
