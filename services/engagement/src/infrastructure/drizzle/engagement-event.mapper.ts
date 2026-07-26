import { randomUUID } from 'node:crypto';
import { ENGAGEMENT_EVENTS_TOPIC, engagementEventSchema } from '@classifieds/contracts';
import type { OutboxMessage } from '@classifieds/outbox';
import type { Favorite } from '../../domain/favorite.js';
import type { Response } from '../../domain/response.js';
import type { ViewBatch } from '../../domain/view-batch.js';

function envelope(): { eventId: string; occurredAt: string; version: number; producer: string } {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    // None of these are a versioned mutable aggregate -- each is a
    // standalone fact, same reasoning as media's event mapper.
    version: 1,
    producer: 'engagement',
  };
}

export function mapFavoriteToOutboxMessage(type: 'favorited' | 'unfavorited', favorite: Favorite): OutboxMessage {
  const payload = engagementEventSchema.parse({
    ...envelope(),
    payload: { type, listingId: favorite.listingId, userId: favorite.userId },
  });
  return { aggregateId: favorite.listingId, topic: ENGAGEMENT_EVENTS_TOPIC, eventKey: favorite.listingId, payload };
}

export function mapResponseToOutboxMessage(response: Response): OutboxMessage {
  const payload = engagementEventSchema.parse({
    ...envelope(),
    payload: {
      type: 'responded',
      listingId: response.listingId,
      userId: response.userId,
      responseId: response.id,
      message: response.message,
    },
  });
  return { aggregateId: response.listingId, topic: ENGAGEMENT_EVENTS_TOPIC, eventKey: response.listingId, payload };
}

export function mapViewBatchToOutboxMessage(batch: ViewBatch): OutboxMessage {
  const payload = engagementEventSchema.parse({
    ...envelope(),
    payload: { type: 'viewed', listingId: batch.listingId, incrementBy: batch.incrementBy },
  });
  return { aggregateId: batch.listingId, topic: ENGAGEMENT_EVENTS_TOPIC, eventKey: batch.listingId, payload };
}
