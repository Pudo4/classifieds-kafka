import type { Listing } from '../../domain/listing.entity.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';

export async function listMyListings(ownerId: string, repo: ListingRepositoryPort): Promise<Listing[]> {
  return repo.findByOwner(ownerId);
}
