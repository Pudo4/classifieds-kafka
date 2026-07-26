import { asc, eq, isNull } from 'drizzle-orm';
import type { EventProducer } from '@classifieds/kafka';
import { outboxEvents } from './schema.js';
import type { OutboxDb } from './with-outbox-tx.js';

export interface OutboxRelayerOptions<TSchema extends Record<string, unknown> = Record<string, never>> {
  db: OutboxDb<TSchema>;
  producer: EventProducer;
  pollIntervalMs?: number;
  batchSize?: number;
  onError?: (error: unknown) => void;
}

/**
 * Polls `outbox_events` for unpublished rows and publishes them in
 * creation order. Rows are marked published one at a time (not batched)
 * so a crash mid-batch re-publishes only the unpublished tail -- the
 * consumer side's version check / `processed_events` table absorbs that
 * duplicate, per the at-least-once contract documented in the README.
 */
export class OutboxRelayer<TSchema extends Record<string, unknown> = Record<string, never>> {
  private readonly db: OutboxDb<TSchema>;
  private readonly producer: EventProducer;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly onError: (error: unknown) => void;
  private stopped = false;
  private loopPromise: Promise<void> | null = null;

  constructor(options: OutboxRelayerOptions<TSchema>) {
    this.db = options.db;
    this.producer = options.producer;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
    this.batchSize = options.batchSize ?? 50;
    this.onError = options.onError ?? ((error: unknown) => console.error('outbox relayer error', error));
  }

  start(): void {
    this.stopped = false;
    this.loopPromise = this.loop();
  }

  /** Lets the current relayOnce() pass finish, then returns -- call from the SIGTERM handler. */
  async stop(): Promise<void> {
    this.stopped = true;
    await this.loopPromise;
  }

  private async loop(): Promise<void> {
    while (!this.stopped) {
      try {
        await this.relayOnce();
      } catch (error) {
        this.onError(error);
      }
      if (!this.stopped) {
        await sleep(this.pollIntervalMs);
      }
    }
  }

  private async relayOnce(): Promise<void> {
    const rows = await this.db
      .select()
      .from(outboxEvents)
      .where(isNull(outboxEvents.publishedAt))
      .orderBy(asc(outboxEvents.createdAt))
      .limit(this.batchSize);

    for (const row of rows) {
      if (this.stopped) return;
      await this.producer.publish({
        topic: row.topic,
        key: row.eventKey,
        value: row.payload,
      });
      await this.db.update(outboxEvents).set({ publishedAt: new Date() }).where(eq(outboxEvents.id, row.id));
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
