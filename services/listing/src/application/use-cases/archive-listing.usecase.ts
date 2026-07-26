import type { Listing } from '../../domain/listing.entity.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';
import { loadOwnedListing } from './load-owned-listing.js';

export async function archiveListing(id: string, ownerId: string, repo: ListingRepositoryPort): Promise<Listing> {
  const listing = await loadOwnedListing(id, ownerId, repo);
  listing.archive();
  await repo.save(listing);
  return listing;
}
