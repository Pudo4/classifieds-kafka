import { describe, expect, it } from 'vitest';
import { engagementEventSchema, ENGAGEMENT_EVENTS_TOPIC } from './engagement.js';

const envelope = {
  eventId: '33333333-3333-3333-3333-333333333333',
  occurredAt: new Date().toISOString(),
  version: 1,
  producer: 'engagement',
};
const listingId = '11111111-1111-1111-1111-111111111111';
const userId = '22222222-2222-2222-2222-222222222222';

describe('engagement contracts', () => {
  it('names the topic with the .v1 suffix', () => {
    expect(ENGAGEMENT_EVENTS_TOPIC).toBe('engagement.events.v1');
  });

  it('validates a favorited event', () => {
    expect(engagementEventSchema.safeParse({ ...envelope, payload: { type: 'favorited', listingId, userId } }).success).toBe(true);
  });

  it('validates a responded event with message and responseId', () => {
    const result = engagementEventSchema.safeParse({
      ...envelope,
      payload: { type: 'responded', listingId, userId, responseId: '44444444-4444-4444-4444-444444444444', message: 'Is this still available?' },
    });
    expect(result.success).toBe(true);
  });

  it('validates a viewed event without a userId', () => {
    const result = engagementEventSchema.safeParse({ ...envelope, payload: { type: 'viewed', listingId, incrementBy: 7 } });
    expect(result.success).toBe(true);
  });

  it('rejects a viewed event with a non-positive increment', () => {
    const result = engagementEventSchema.safeParse({ ...envelope, payload: { type: 'viewed', listingId, incrementBy: 0 } });
    expect(result.success).toBe(false);
  });
});
