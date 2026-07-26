import { describe, expect, it } from 'vitest';
import { notificationRequestEventSchema, NOTIFICATION_REQUESTS_TOPIC } from './notification.js';

const envelope = {
  eventId: '33333333-3333-3333-3333-333333333333',
  occurredAt: new Date().toISOString(),
  version: 1,
  producer: 'moderation',
};

describe('notification contracts', () => {
  it('names the topic with the .v1 suffix', () => {
    expect(NOTIFICATION_REQUESTS_TOPIC).toBe('notification.requests.v1');
  });

  it('validates a request from an arbitrary producer and category', () => {
    const result = notificationRequestEventSchema.safeParse({
      ...envelope,
      payload: { userId: '11111111-1111-1111-1111-111111111111', category: 'listing.approved', message: 'Ваше объявление одобрено' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty message', () => {
    const result = notificationRequestEventSchema.safeParse({
      ...envelope,
      payload: { userId: '11111111-1111-1111-1111-111111111111', category: 'listing.approved', message: '' },
    });
    expect(result.success).toBe(false);
  });
});
