import { randomUUID } from 'node:crypto';
import { MEDIA_DLQ_TOPIC, MEDIA_EVENTS_TOPIC, mediaEventSchema } from '@classifieds/contracts';
import type { OutboxMessage } from '@classifieds/outbox';
import type { MediaDomainEvent } from '../../domain/media-asset.js';

/**
 * `uploaded`/`processed` go to the main log (what `listing`/`search` would
 * consume). `failed` goes to the DLQ topic only, not the main log --
 * DLQ is where a human looks, not a source of business events for other
 * services to react to.
 */
export function mapMediaDomainEventToOutboxMessage(event: MediaDomainEvent): OutboxMessage {
  const envelope = {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    // Not a versioned mutable aggregate in the sense `listing` is -- each
    // event is a standalone fact, and nothing consuming this topic dedups
    // by version (see packages/idempotency's processed_events instead).
    version: 1,
    producer: 'media',
  };

  const fields = {
    id: event.asset.id,
    listingId: event.asset.listingId,
    ownerId: event.asset.ownerId,
    originalKey: event.asset.originalKey,
  };

  if (event.type === 'uploaded') {
    const payload = mediaEventSchema.parse({ ...envelope, payload: { ...fields, type: 'uploaded' } });
    return { aggregateId: event.asset.id, topic: MEDIA_EVENTS_TOPIC, eventKey: event.asset.id, payload };
  }

  if (event.type === 'processed') {
    const previewKey = event.asset.previewKey;
    if (previewKey === null) throw new Error('processed media event is missing its previewKey');
    const payload = mediaEventSchema.parse({ ...envelope, payload: { ...fields, type: 'processed', previewKey } });
    return { aggregateId: event.asset.id, topic: MEDIA_EVENTS_TOPIC, eventKey: event.asset.id, payload };
  }

  const payload = mediaEventSchema.parse({ ...envelope, payload: { ...fields, type: 'failed', reason: event.reason } });
  return { aggregateId: event.asset.id, topic: MEDIA_DLQ_TOPIC, eventKey: event.asset.id, payload };
}
