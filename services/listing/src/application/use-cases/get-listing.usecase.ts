import type { Listing } from '../../domain/listing.entity.js';
import { ListingNotFoundError } from '../errors.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';

/**
 * Non-owners only ever see `active` listings, and a non-active listing they
 * ask for 404s exactly like one that doesn't exist -- status is not leaked
 * to strangers.
 */
export async function getListing(id: string, requesterId: string, repo: ListingRepositoryPort): Promise<Listing> {
  const listing = await repo.findById(id);
  if (!listing) throw new ListingNotFoundError(id);
  const isOwner = listing.ownerId === requesterId;
  if (!isOwner && listing.status !== 'active') {
    throw new ListingNotFoundError(id);
  }
  return listing;
}
