import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineEvent } from './base-event.js';
import { versionedTopic } from './versioning.js';

describe('defineEvent', () => {
  it('validates a well-formed event envelope + payload', () => {
    const schema = defineEvent(z.object({ listingId: z.string().uuid() }));
    const result = schema.safeParse({
      eventId: '11111111-1111-1111-1111-111111111111',
      occurredAt: new Date().toISOString(),
      version: 1,
      producer: 'listing',
      payload: { listingId: '22222222-2222-2222-2222-222222222222' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a payload missing required envelope fields', () => {
    const schema = defineEvent(z.object({ listingId: z.string().uuid() }));
    const result = schema.safeParse({
      payload: { listingId: '22222222-2222-2222-2222-222222222222' },
    });
    expect(result.success).toBe(false);
  });
});

describe('versionedTopic', () => {
  it('appends the major version suffix', () => {
    expect(versionedTopic('listing.events', 1)).toBe('listing.events.v1');
  });

  it('rejects a non-positive version', () => {
    expect(() => versionedTopic('listing.events', 0)).toThrow();
  });
});
