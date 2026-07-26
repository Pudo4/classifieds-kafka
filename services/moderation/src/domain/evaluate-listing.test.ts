import { describe, expect, it } from 'vitest';
import { evaluateListing } from './evaluate-listing.js';
import { DEFAULT_MODERATION_CONFIG } from './moderation-config.js';
import type { ListingSubmission } from './moderation-decision.js';

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

describe('evaluateListing', () => {
  it('approves a clean listing', () => {
    const result = evaluateListing(submission(), DEFAULT_MODERATION_CONFIG);
    expect(result).toEqual({ verdict: 'approved', reason: null });
  });

  it('rejects a stop word in the title', () => {
    const result = evaluateListing(submission({ title: 'Definitely not a SCAM bike' }), DEFAULT_MODERATION_CONFIG);
    expect(result.verdict).toBe('rejected');
    expect(result.reason).toContain('stop word');
  });

  it('rejects a stop word in the description, case-insensitively', () => {
    const result = evaluateListing(submission({ description: 'this bike was Stolen from a shop' }), DEFAULT_MODERATION_CONFIG);
    expect(result.verdict).toBe('rejected');
    expect(result.reason).toContain('stop word');
  });

  it('rejects a price below the minimum', () => {
    const result = evaluateListing(submission({ priceCents: 0 }), DEFAULT_MODERATION_CONFIG);
    expect(result.verdict).toBe('rejected');
    expect(result.reason).toContain('below the minimum');
  });

  it('rejects a price above the maximum', () => {
    const result = evaluateListing(submission({ priceCents: 999_999_999 }), DEFAULT_MODERATION_CONFIG);
    expect(result.verdict).toBe('rejected');
    expect(result.reason).toContain('above the maximum');
  });

  it('rejects too many links in the description', () => {
    const result = evaluateListing(
      submission({ description: 'see https://a.example and https://b.example and https://c.example' }),
      DEFAULT_MODERATION_CONFIG,
    );
    expect(result.verdict).toBe('rejected');
    expect(result.reason).toContain('too many links');
  });

  it('allows up to the max link count', () => {
    const result = evaluateListing(
      submission({ description: 'see https://a.example and https://b.example' }),
      DEFAULT_MODERATION_CONFIG,
    );
    expect(result.verdict).toBe('approved');
  });

  it('joins multiple violations into one reason', () => {
    const result = evaluateListing(submission({ title: 'scam', priceCents: 0 }), DEFAULT_MODERATION_CONFIG);
    expect(result.verdict).toBe('rejected');
    expect(result.reason).toContain('stop word');
    expect(result.reason).toContain('below the minimum');
  });
});
