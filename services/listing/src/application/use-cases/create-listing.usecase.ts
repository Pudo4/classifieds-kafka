import { randomUUID } from 'node:crypto';
import { Listing } from '../../domain/listing.entity.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';

export interface CreateListingInput {
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
}

export async function createListing(input: CreateListingInput, repo: ListingRepositoryPort): Promise<Listing> {
  const listing = Listing.create({ id: randomUUID(), ...input });
  await repo.save(listing);
  return listing;
}
