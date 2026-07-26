import type { ViewBatch } from '../../domain/view-batch.js';

export const VIEW_REPOSITORY = Symbol('VIEW_REPOSITORY');

export interface ViewRepositoryPort {
  /** Applies every batch's increment and writes one outbox 'viewed' event per listing, atomically as a whole. */
  applyBatches(batches: ViewBatch[]): Promise<void>;
  getViewCount(listingId: string): Promise<number>;
}
