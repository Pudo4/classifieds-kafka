import type { Listing } from '../../domain/listing.entity.js';

export const LISTING_REPOSITORY = Symbol('LISTING_REPOSITORY');

/**
 * The use-cases below never mention Postgres, Drizzle, or Kafka -- only
 * this port. The Drizzle implementation (infrastructure/) is what pulls the
 * aggregate's domain events and writes them to the outbox table in the same
 * transaction as the persistence write; that's an infra concern, not an
 * application one.
 */
export interface ListingRepositoryPort {
  save(listing: Listing): Promise<void>;
  findById(id: string): Promise<Listing | null>;
  findByOwner(ownerId: string): Promise<Listing[]>;
  /**
   * Atomically: claim `sourceEventId` for idempotency, load the listing,
   * run `mutate` against it, persist the result and its outbox events --
   * all in one transaction. Returns `false` if `sourceEventId` was already
   * claimed (duplicate delivery) or the listing doesn't exist; `mutate`
   * throwing (e.g. the listing already moved past `pending`) rolls the
   * whole transaction back, including the claim.
   */
  applyEventIdempotently(listingId: string, sourceEventId: string, mutate: (listing: Listing) => void): Promise<boolean>;
}
