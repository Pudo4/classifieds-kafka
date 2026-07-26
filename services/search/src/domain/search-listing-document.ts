import type { ListingStatus } from '@classifieds/contracts';

/**
 * What's stored in the Meilisearch index. `version` isn't shown to
 * clients -- it's bookkeeping so `shouldApplySnapshot` can tell a stale or
 * duplicate `listing.snapshot.v1` message from a fresh one (see
 * idempotency.ts).
 */
export interface SearchListingDocument {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  status: ListingStatus;
  version: number;
}
