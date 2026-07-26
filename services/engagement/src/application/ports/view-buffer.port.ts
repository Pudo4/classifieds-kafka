import type { ViewBatch } from '../../domain/view-batch.js';

export const VIEW_BUFFER = Symbol('VIEW_BUFFER');

/**
 * The fast path a view request hits: no DB, no outbox, just an increment.
 * `drainPending` is what the periodic flush job (see
 * use-cases/flush-view-batches.usecase.ts) calls to collect what's built
 * up since the last flush.
 */
export interface ViewBufferPort {
  recordView(listingId: string): Promise<void>;
  /** Atomically reads and clears every pending counter. */
  drainPending(): Promise<ViewBatch[]>;
}
