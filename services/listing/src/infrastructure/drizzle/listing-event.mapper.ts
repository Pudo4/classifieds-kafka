import { randomUUID } from 'node:crypto';
import {
  LISTING_EVENTS_TOPIC,
  LISTING_SNAPSHOT_TOPIC,
  listingEventSchema,
  listingSnapshotEventSchema,
  type ListingEventPayload,
} from '@classifieds/contracts';
import type { OutboxMessage } from '@classifieds/outbox';
import type { ListingDomainEvent, ListingProps } from '../../domain/listing.entity.js';

function toWireFields(listing: ListingProps) {
  return {
    id: listing.id,
    ownerId: listing.ownerId,
    title: listing.title,
    description: listing.description,
    priceCents: listing.priceCents,
    category: listing.category,
    status: listing.status,
  };
}

function toEventPayload(event: ListingDomainEvent): ListingEventPayload {
  const fields = toWireFields(event.listing);
  if (event.type === 'rejected') {
    return { ...fields, type: 'rejected', reason: event.reason };
  }
  return { ...fields, type: event.type };
}

/**
 * One domain event becomes up to two outbox rows: the append-only log entry
 * (`listing.events.v1`) and, for anything but the terminal `archived`
 * transition, the refreshed compacted snapshot (`listing.snapshot.v1`).
 * `archived` instead produces a tombstone (`payload: null`) on the snapshot
 * topic, so read-models rebuilt from it drop the key entirely.
 */
export function mapListingDomainEventToOutboxMessages(event: ListingDomainEvent): OutboxMessage[] {
  const envelope = {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    version: event.listing.version,
    producer: 'listing',
  };

  const eventEnvelope = listingEventSchema.parse({ ...envelope, payload: toEventPayload(event) });
  const eventMessage: OutboxMessage = {
    aggregateId: event.listing.id,
    topic: LISTING_EVENTS_TOPIC,
    eventKey: event.listing.id,
    payload: eventEnvelope,
  };

  const snapshotMessage: OutboxMessage =
    event.type === 'archived'
      ? { aggregateId: event.listing.id, topic: LISTING_SNAPSHOT_TOPIC, eventKey: event.listing.id, payload: null }
      : {
          aggregateId: event.listing.id,
          topic: LISTING_SNAPSHOT_TOPIC,
          eventKey: event.listing.id,
          payload: listingSnapshotEventSchema.parse({ ...envelope, payload: toWireFields(event.listing) }),
        };

  return [eventMessage, snapshotMessage];
}
