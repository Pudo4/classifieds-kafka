import { describe, expect, it } from 'vitest';
import { moderationDecisionEventSchema, MODERATION_DECISIONS_TOPIC } from './moderation.js';

const envelope = {
  eventId: '33333333-3333-3333-3333-333333333333',
  occurredAt: new Date().toISOString(),
  version: 1,
  producer: 'moderation',
};

describe('moderation contracts', () => {
  it('names the topic with the .v1 suffix', () => {
    expect(MODERATION_DECISIONS_TOPIC).toBe('moderation.decisions.v1');
  });

  it('validates an approved decision with a null reason', () => {
    const result = moderationDecisionEventSchema.safeParse({
      ...envelope,
      payload: { listingId: '11111111-1111-1111-1111-111111111111', verdict: 'approved', reason: null },
    });
    expect(result.success).toBe(true);
  });

  it('validates a rejected decision with a reason', () => {
    const result = moderationDecisionEventSchema.safeParse({
      ...envelope,
      payload: { listingId: '11111111-1111-1111-1111-111111111111', verdict: 'rejected', reason: 'stop word: scam' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing reason field entirely', () => {
    const result = moderationDecisionEventSchema.safeParse({
      ...envelope,
      payload: { listingId: '11111111-1111-1111-1111-111111111111', verdict: 'rejected' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an approved verdict carrying a non-null reason', () => {
    const result = moderationDecisionEventSchema.safeParse({
      ...envelope,
      payload: { listingId: '11111111-1111-1111-1111-111111111111', verdict: 'approved', reason: 'looks fine' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a rejected verdict carrying a null reason', () => {
    const result = moderationDecisionEventSchema.safeParse({
      ...envelope,
      payload: { listingId: '11111111-1111-1111-1111-111111111111', verdict: 'rejected', reason: null },
    });
    expect(result.success).toBe(false);
  });
});
