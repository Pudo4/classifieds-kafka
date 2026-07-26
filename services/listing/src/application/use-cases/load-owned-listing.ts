import type { Listing } from '../../domain/listing.entity.js';
import { ListingForbiddenError, ListingNotFoundError } from '../errors.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';

export async function loadOwnedListing(id: string, ownerId: string, repo: ListingRepositoryPort): Promise<Listing> {
  const listing = await repo.findById(id);
  if (!listing) throw new ListingNotFoundError(id);
  if (listing.ownerId !== ownerId) throw new ListingForbiddenError(id);
  return listing;
}
