import { describe, expect, it } from 'vitest';
import { InMemoryModerationRepository } from './testing/in-memory-moderation-repository.js';
import { reviewSubmittedListing } from './use-cases/review-submitted-listing.usecase.js';
import type { ListingSubmission } from '../domain/moderation-decision.js';

function submission(overrides: Partial<ListingSubmission> = {}): ListingSubmission {
  return {
    listingId: 'listing-1',
    ownerId: 'owner-1',
    title: 'Mountain bike',
    description: 'Barely used, great condition',
    priceCents: 15000,
    ...overrides,
  };
}

describe('reviewSubmittedListing', () => {
  it('approves a clean submission and records the decision', async () => {
    const repo = new InMemoryModerationRepository();
    const decision = await reviewSubmittedListing({ sourceEventId: 'evt-1', submission: submission() }, repo);
    expect(decision?.verdict).toBe('approved');
    expect(repo.decisions).toHaveLength(1);
  });

  it('rejects a submission with a stop word, with a reason', async () => {
    const repo = new InMemoryModerationRepository();
    const decision = await reviewSubmittedListing(
      { sourceEventId: 'evt-1', submission: submission({ title: 'scam bike' }) },
      repo,
    );
    expect(decision?.verdict).toBe('rejected');
    expect(decision?.reason).toContain('stop word');
  });

  it('is idempotent: the same sourceEventId is only ever recorded once', async () => {
    const repo = new InMemoryModerationRepository();
    const first = await reviewSubmittedListing({ sourceEventId: 'evt-1', submission: submission() }, repo);
    const second = await reviewSubmittedListing({ sourceEventId: 'evt-1', submission: submission() }, repo);
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(repo.decisions).toHaveLength(1);
  });

  it('different events for the same listing (resubmission) each produce a decision', async () => {
    const repo = new InMemoryModerationRepository();
    await reviewSubmittedListing({ sourceEventId: 'evt-1', submission: submission({ title: 'scam' }) }, repo);
    await reviewSubmittedListing({ sourceEventId: 'evt-2', submission: submission() }, repo);
    expect(repo.decisions).toHaveLength(2);
    expect(repo.decisions.map((d) => d.verdict)).toEqual(['rejected', 'approved']);
  });

  it('passes the listing owner and title through for the repository to notify', async () => {
    const repo = new InMemoryModerationRepository();
    await reviewSubmittedListing(
      { sourceEventId: 'evt-1', submission: submission({ ownerId: 'owner-42', title: 'Guitar' }) },
      repo,
    );
    expect(repo.notifiedOwners).toEqual([{ ownerId: 'owner-42', listingTitle: 'Guitar', decision: repo.decisions[0] }]);
  });
});
