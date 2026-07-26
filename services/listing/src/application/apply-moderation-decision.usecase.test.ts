import { describe, expect, it } from 'vitest';
import { InMemoryListingRepository } from './testing/in-memory-listing-repository.js';
import { createListing } from './use-cases/create-listing.usecase.js';
import { submitListing } from './use-cases/submit-listing.usecase.js';
import { applyModerationDecision } from './use-cases/apply-moderation-decision.usecase.js';

const OWNER = '11111111-1111-1111-1111-111111111111';

async function seedPendingListing(repo: InMemoryListingRepository) {
  const listing = await createListing(
    { ownerId: OWNER, title: 'Bike', description: 'A bike', priceCents: 1000, category: 'sports' },
    repo,
  );
  return submitListing(listing.id, OWNER, repo);
}

describe('applyModerationDecision', () => {
  it('approves a pending listing', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedPendingListing(repo);
    const applied = await applyModerationDecision(
      { listingId: listing.id, sourceEventId: 'evt-1', verdict: 'approved', reason: null },
      repo,
    );
    expect(applied).toBe(true);
    expect((await repo.findById(listing.id))?.status).toBe('active');
  });

  it('rejects a pending listing with the given reason', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedPendingListing(repo);
    await applyModerationDecision(
      { listingId: listing.id, sourceEventId: 'evt-1', verdict: 'rejected', reason: 'stop word: scam' },
      repo,
    );
    const reloaded = await repo.findById(listing.id);
    expect(reloaded?.status).toBe('rejected');
    expect(reloaded?.toSnapshot().rejectionReason).toBe('stop word: scam');
  });

  it('is idempotent: redelivering the same eventId is a no-op the second time', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedPendingListing(repo);
    const first = await applyModerationDecision(
      { listingId: listing.id, sourceEventId: 'evt-1', verdict: 'approved', reason: null },
      repo,
    );
    const second = await applyModerationDecision(
      { listingId: listing.id, sourceEventId: 'evt-1', verdict: 'approved', reason: null },
      repo,
    );
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('a stale decision for an already-archived listing is dropped, not thrown', async () => {
    const repo = new InMemoryListingRepository();
    const listing = await seedPendingListing(repo);
    const archived = await repo.findById(listing.id);
    archived?.archive();
    if (archived) await repo.save(archived);

    const applied = await applyModerationDecision(
      { listingId: listing.id, sourceEventId: 'evt-1', verdict: 'approved', reason: null },
      repo,
    );
    expect(applied).toBe(false);
  });
});
