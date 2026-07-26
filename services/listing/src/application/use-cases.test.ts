import { describe, expect, it } from 'vitest';
import { InMemoryListingRepository } from './testing/in-memory-listing-repository.js';
import { createListing } from './use-cases/create-listing.usecase.js';
import { updateListing } from './use-cases/update-listing.usecase.js';
import { submitListing } from './use-cases/submit-listing.usecase.js';
import { archiveListing } from './use-cases/archive-listing.usecase.js';
import { getListing } from './use-cases/get-listing.usecase.js';
import { listMyListings } from './use-cases/list-my-listings.usecase.js';
import { ListingForbiddenError, ListingNotFoundError } from './errors.js';
import { ListingNotEditableError } from '../domain/listing.errors.js';

const OWNER = '11111111-1111-1111-1111-111111111111';
const STRANGER = '22222222-2222-2222-2222-222222222222';

async function seedListing(repo: InMemoryListingRepository) {
  return createListing(
    { ownerId: OWNER, title: 'Bike', description: 'A bike', priceCents: 1000, category: 'sports' },
    repo,
  );
}

describe('createListing', () => {
  it('creates a draft and records a "created" outbox-bound event', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    expect(listing.status).toBe('draft');
    expect(repo.publishedEvents.map((e) => e.type)).toEqual(['created']);
  });
});

describe('updateListing', () => {
  it('updates fields while draft', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    const updated = await updateListing(listing.id, OWNER, { title: 'Faster bike' }, repo);
    expect(updated.toSnapshot().title).toBe('Faster bike');
  });

  it('rejects a stranger with 403', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    await expect(updateListing(listing.id, STRANGER, { title: 'x' }, repo)).rejects.toBeInstanceOf(
      ListingForbiddenError,
    );
  });

  it('404s for a non-existent listing', async () => {
    const repo = new InMemoryListingRepository();
    await expect(updateListing('does-not-exist', OWNER, { title: 'x' }, repo)).rejects.toBeInstanceOf(
      ListingNotFoundError,
    );
  });

  it('bubbles up ListingNotEditableError once pending', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    await submitListing(listing.id, OWNER, repo);
    await expect(updateListing(listing.id, OWNER, { title: 'x' }, repo)).rejects.toBeInstanceOf(
      ListingNotEditableError,
    );
  });
});

describe('submitListing / archiveListing', () => {
  it('submit moves draft to pending and records the event', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    const submitted = await submitListing(listing.id, OWNER, repo);
    expect(submitted.status).toBe('pending');
    expect(repo.publishedEvents.map((e) => e.type)).toEqual(['created', 'submitted']);
  });

  it('archive is forbidden for a stranger', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    await expect(archiveListing(listing.id, STRANGER, repo)).rejects.toBeInstanceOf(ListingForbiddenError);
  });
});

describe('getListing', () => {
  it('owner can see a draft listing', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    const found = await getListing(listing.id, OWNER, repo);
    expect(found.id).toBe(listing.id);
  });

  it('stranger gets 404 (not 403) for a non-active listing', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    await expect(getListing(listing.id, STRANGER, repo)).rejects.toBeInstanceOf(ListingNotFoundError);
  });

  it('stranger can see an active listing', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedListing(repo);
    await submitListing(listing.id, OWNER, repo);
    const pending = await getListing(listing.id, OWNER, repo);
    pending.approve();
    await repo.save(pending);
    const found = await getListing(listing.id, STRANGER, repo);
    expect(found.status).toBe('active');
  });
});

describe('listMyListings', () => {
  it('returns only the owner’s listings', async () => {
    const repo = new InMemoryListingRepository();
    await seedListing(repo);
    await createListing(
      { ownerId: STRANGER, title: 'Sofa', description: 'A sofa', priceCents: 5000, category: 'furniture' },
      repo,
    );
    const mine = await listMyListings(OWNER, repo);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.ownerId).toBe(OWNER);
  });
});
