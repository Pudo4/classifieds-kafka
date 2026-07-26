import type { ViewBufferPort } from '../ports/view-buffer.port.js';

/** The entire "handle a page view" HTTP path: bump a counter, nothing else -- no DB write, no outbox. */
export async function recordView(listingId: string, buffer: ViewBufferPort): Promise<void> {
  await buffer.recordView(listingId);
}
