import { describe, expect, it } from 'vitest';
import {
  mediaEventSchema,
  mediaRetryEventSchema,
  MEDIA_EVENTS_TOPIC,
  MEDIA_RETRY_10S_TOPIC,
  MEDIA_RETRY_1M_TOPIC,
  MEDIA_DLQ_TOPIC,
} from './media.js';

const envelope = {
  eventId: '33333333-3333-3333-3333-333333333333',
  occurredAt: new Date().toISOString(),
  version: 1,
  producer: 'media',
};

const fields = {
  id: '11111111-1111-1111-1111-111111111111',
  listingId: '22222222-2222-2222-2222-222222222222',
  ownerId: '44444444-4444-4444-4444-444444444444',
  originalKey: 'listings/22222222-2222-2222-2222-222222222222/11111111-1111-1111-1111-111111111111/original.jpg',
};

describe('media topic names', () => {
  it('derives the retry and dlq topics from the main topic name', () => {
    expect(MEDIA_EVENTS_TOPIC).toBe('media.events.v1');
    expect(MEDIA_RETRY_10S_TOPIC).toBe('media.events.v1.retry.10s');
    expect(MEDIA_RETRY_1M_TOPIC).toBe('media.events.v1.retry.1m');
    expect(MEDIA_DLQ_TOPIC).toBe('media.events.v1.dlq');
  });
});

describe('mediaEventSchema', () => {
  it('validates an uploaded event', () => {
    expect(mediaEventSchema.safeParse({ ...envelope, payload: { ...fields, type: 'uploaded' } }).success).toBe(true);
  });

  it('validates a processed event with a previewKey', () => {
    const result = mediaEventSchema.safeParse({
      ...envelope,
      payload: { ...fields, type: 'processed', previewKey: 'listings/.../preview.webp' },
    });
    expect(result.success).toBe(true);
  });

  it('requires a reason on a failed event', () => {
    const result = mediaEventSchema.safeParse({ ...envelope, payload: { ...fields, type: 'failed' } });
    expect(result.success).toBe(false);
  });
});

describe('mediaRetryEventSchema', () => {
  it('validates a retry payload with retryAfter', () => {
    const result = mediaRetryEventSchema.safeParse({
      ...envelope,
      payload: { ...fields, retryAfter: new Date().toISOString() },
    });
    expect(result.success).toBe(true);
  });
});
