import { describe, expect, it } from 'vitest';
import { listingEventSchema, listingSnapshotEventSchema, LISTING_EVENTS_TOPIC, LISTING_SNAPSHOT_TOPIC } from './listing.js';

const baseFields = {
  id: '11111111-1111-1111-1111-111111111111',
  ownerId: '22222222-2222-2222-2222-222222222222',
  title: 'Bike',
  description: 'A bike',
  priceCents: 1000,
  category: 'sports',
  status: 'draft' as const,
};

const envelope = {
  eventId: '33333333-3333-3333-3333-333333333333',
  occurredAt: new Date().toISOString(),
  version: 1,
  producer: 'listing',
};

describe('listing contracts', () => {
  it('names topics with the .v1 suffix', () => {
    expect(LISTING_EVENTS_TOPIC).toBe('listing.events.v1');
    expect(LISTING_SNAPSHOT_TOPIC).toBe('listing.snapshot.v1');
  });

  it('validates a "created" event', () => {
    const result = listingEventSchema.safeParse({
      ...envelope,
      payload: { ...baseFields, type: 'created' },
    });
    expect(result.success).toBe(true);
  });

  it('requires a reason on "rejected" events', () => {
    const result = listingEventSchema.safeParse({
      ...envelope,
      payload: { ...baseFields, type: 'rejected', status: 'rejected' },
    });
    expect(result.success).toBe(false);
  });

  it('validates a snapshot payload', () => {
    const result = listingSnapshotEventSchema.safeParse({
      ...envelope,
      payload: baseFields,
    });
    expect(result.success).toBe(true);
  });
});
