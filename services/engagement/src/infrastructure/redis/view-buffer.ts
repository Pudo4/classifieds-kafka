import type { Redis } from 'ioredis';
import type { ViewBatch } from '../../domain/view-batch.js';
import type { ViewBufferPort } from '../../application/ports/view-buffer.port.js';

const KEY_PREFIX = 'engagement:views:';

export class RedisViewBuffer implements ViewBufferPort {
  constructor(private readonly redis: Redis) {}

  async recordView(listingId: string): Promise<void> {
    await this.redis.incr(`${KEY_PREFIX}${listingId}`);
  }

  /**
   * `KEYS` (not `SCAN`) is fine at this project's volume -- a handful of
   * pending counters between 5s flushes, not a production-scale keyspace.
   * Each key is drained with `GETDEL`, atomic per key: a view landing
   * between the scan and the drain either lands in this counter (included)
   * or starts a fresh one for the next flush (deferred, never lost).
   */
  async drainPending(): Promise<ViewBatch[]> {
    const keys = await this.redis.keys(`${KEY_PREFIX}*`);
    if (keys.length === 0) return [];

    const batches: ViewBatch[] = [];
    for (const key of keys) {
      const value = await this.redis.getdel(key);
      if (value === null) continue; // another flush already drained it
      const incrementBy = Number(value);
      if (incrementBy > 0) {
        batches.push({ listingId: key.slice(KEY_PREFIX.length), incrementBy });
      }
    }
    return batches;
  }
}
