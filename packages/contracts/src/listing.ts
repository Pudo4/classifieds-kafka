import { z } from 'zod';
import { defineEvent } from './base-event.js';
import { versionedTopic } from './versioning.js';

export const LISTING_EVENTS_TOPIC = versionedTopic('listing.events', 1);
export const LISTING_SNAPSHOT_TOPIC = versionedTopic('listing.snapshot', 1);

export const listingStatusSchema = z.enum(['draft', 'pending', 'active', 'rejected', 'archived']);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

const listingFieldsSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  category: z.string().min(1),
  status: listingStatusSchema,
});

/**
 * Log of what happened -- every listing state change lands here as its own
 * discriminated event, carrying the full listing fields so a consumer never
 * needs to join against a previous message to make sense of one.
 */
export const listingEventPayloadSchema = z.discriminatedUnion('type', [
  listingFieldsSchema.extend({ type: z.literal('created') }),
  listingFieldsSchema.extend({ type: z.literal('updated') }),
  listingFieldsSchema.extend({ type: z.literal('submitted') }),
  listingFieldsSchema.extend({ type: z.literal('approved') }),
  listingFieldsSchema.extend({ type: z.literal('rejected'), reason: z.string() }),
  listingFieldsSchema.extend({ type: z.literal('archived') }),
]);
export type ListingEventPayload = z.infer<typeof listingEventPayloadSchema>;

export const listingEventSchema = defineEvent(listingEventPayloadSchema);
export type ListingEvent = z.infer<typeof listingEventSchema>;

/**
 * Changelog of current state, keyed by listingId, compacted. A tombstone
 * (Kafka `value = null`, published when a listing is archived) removes the
 * key from any store rebuilt from this topic -- there is no in-band
 * "deleted" payload shape for it.
 */
export const listingSnapshotPayloadSchema = listingFieldsSchema;
export type ListingSnapshotPayload = z.infer<typeof listingSnapshotPayloadSchema>;

export const listingSnapshotEventSchema = defineEvent(listingSnapshotPayloadSchema);
export type ListingSnapshotEvent = z.infer<typeof listingSnapshotEventSchema>;
