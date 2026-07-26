import type { ViewBatch } from '../../domain/view-batch.js';
import type { ViewBufferPort } from '../ports/view-buffer.port.js';

export class InMemoryViewBuffer implements ViewBufferPort {
  private readonly pending = new Map<string, number>();

  async recordView(listingId: string): Promise<void> {
    this.pending.set(listingId, (this.pending.get(listingId) ?? 0) + 1);
  }

  async drainPending(): Promise<ViewBatch[]> {
    const batches = [...this.pending.entries()].map(([listingId, incrementBy]) => ({ listingId, incrementBy }));
    this.pending.clear();
    return batches;
  }
}
