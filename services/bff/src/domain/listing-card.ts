/**
 * BFF-specific view models -- not any single upstream service's own
 * response shape, but what the "listing card" screen actually needs.
 * Composition (not a local replica) is the deliberate choice here per
 * README's ownership table: this is a single-item detail view where
 * freshness matters more than request count, unlike a list/feed screen
 * where N+1 fan-out would be the wrong tradeoff.
 */
export interface ListingSummary {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  status: string;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaSummary {
  id: string;
  status: string;
  previewKey: string | null;
}

export interface ListingCard {
  listing: ListingSummary;
  media: MediaSummary[];
  counters: {
    viewCount: number;
    favoriteCount: number;
  };
}
