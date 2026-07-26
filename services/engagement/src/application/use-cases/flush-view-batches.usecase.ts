import type { ViewBufferPort } from '../ports/view-buffer.port.js';
import type { ViewRepositoryPort } from '../ports/view-repository.port.js';

/** Called by main.ts on a timer, never by an HTTP request -- this is where "batched" actually happens. */
export async function flushViewBatches(buffer: ViewBufferPort, repo: ViewRepositoryPort): Promise<number> {
  const batches = await buffer.drainPending();
  if (batches.length === 0) return 0;
  await repo.applyBatches(batches);
  return batches.length;
}
