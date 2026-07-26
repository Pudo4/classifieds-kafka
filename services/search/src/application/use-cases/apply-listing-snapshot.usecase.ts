import { shouldApplySnapshot } from '../../domain/idempotency.js';
import type { SearchListingDocument } from '../../domain/search-listing-document.js';
import type { SearchIndexPort } from '../ports/search-index.port.js';

export type IncomingSnapshot =
  | { kind: 'upsert'; version: number; document: SearchListingDocument }
  | { kind: 'delete' };

/**
 * `kind: 'delete'` is the tombstone case (`listing.snapshot.v1` value =
 * null, published when a listing is archived). A tombstone carries no
 * version, so it's applied unconditionally -- safe because `archived` is a
 * terminal state in `listing`'s state machine, nothing can ever update this
 * id again after it.
 */
export async function applyListingSnapshot(id: string, incoming: IncomingSnapshot, index: SearchIndexPort): Promise<void> {
  if (incoming.kind === 'delete') {
    await index.remove(id);
    return;
  }

  const currentVersion = await index.getVersion(id);
  if (!shouldApplySnapshot(incoming.version, currentVersion)) return;
  await index.upsert(incoming.document);
}
