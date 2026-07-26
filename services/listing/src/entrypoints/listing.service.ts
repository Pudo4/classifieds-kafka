import { Inject, Injectable } from '@nestjs/common';
import type { Listing, ListingDetailsPatch } from '../domain/listing.entity.js';
import { LISTING_REPOSITORY, type ListingRepositoryPort } from '../application/ports/listing-repository.port.js';
import { createListing, type CreateListingInput } from '../application/use-cases/create-listing.usecase.js';
import { updateListing } from '../application/use-cases/update-listing.usecase.js';
import { submitListing } from '../application/use-cases/submit-listing.usecase.js';
import { archiveListing } from '../application/use-cases/archive-listing.usecase.js';
import { getListing } from '../application/use-cases/get-listing.usecase.js';
import { listMyListings } from '../application/use-cases/list-my-listings.usecase.js';

/**
 * The one place Nest DI meets the pure use-case functions in
 * `application/`. Everything below is a one-line delegation on purpose --
 * this class carries no logic of its own to keep the use-cases testable
 * without Nest (see application/use-cases.test.ts, which never imports
 * this file).
 */
@Injectable()
export class ListingService {
  constructor(@Inject(LISTING_REPOSITORY) private readonly repo: ListingRepositoryPort) {}

  createListing(input: CreateListingInput): Promise<Listing> {
    return createListing(input, this.repo);
  }

  updateListing(id: string, ownerId: string, patch: ListingDetailsPatch): Promise<Listing> {
    return updateListing(id, ownerId, patch, this.repo);
  }

  submitListing(id: string, ownerId: string): Promise<Listing> {
    return submitListing(id, ownerId, this.repo);
  }

  archiveListing(id: string, ownerId: string): Promise<Listing> {
    return archiveListing(id, ownerId, this.repo);
  }

  getListing(id: string, requesterId: string): Promise<Listing> {
    return getListing(id, requesterId, this.repo);
  }

  listMyListings(ownerId: string): Promise<Listing[]> {
    return listMyListings(ownerId, this.repo);
  }
}
