import type { Listing } from '../../domain/listing.entity.js';

export interface ListingResponse {
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

export function toListingResponse(listing: Listing): ListingResponse {
  const snapshot = listing.toSnapshot();
  return {
    ...snapshot,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}
