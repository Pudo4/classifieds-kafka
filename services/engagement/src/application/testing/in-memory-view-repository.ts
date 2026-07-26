import type { ViewBatch } from '../../domain/view-batch.js';
import type { ViewRepositoryPort } from '../ports/view-repository.port.js';

export class InMemoryViewRepository implements ViewRepositoryPort {
  private readonly counts = new Map<string, number>();
  readonly appliedBatches: ViewBatch[] = [];

  async applyBatches(batches: ViewBatch[]): Promise<void> {
    for (const batch of batches) {
      this.counts.set(batch.listingId, (this.counts.get(batch.listingId) ?? 0) + batch.incrementBy);
      this.appliedBatches.push(batch);
    }
  }

  async getViewCount(listingId: string): Promise<number> {
    return this.counts.get(listingId) ?? 0;
  }
}
