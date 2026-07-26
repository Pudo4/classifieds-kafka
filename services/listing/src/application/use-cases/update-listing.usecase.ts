import type { ListingDetailsPatch, Listing } from '../../domain/listing.entity.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';
import { loadOwnedListing } from './load-owned-listing.js';

export async function updateListing(
  id: string,
  ownerId: string,
  patch: ListingDetailsPatch,
  repo: ListingRepositoryPort,
): Promise<Listing> {
  const listing = await loadOwnedListing(id, ownerId, repo);
  listing.updateDetails(patch);
  await repo.save(listing);
  return listing;
}
