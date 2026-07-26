import { z } from 'zod';
import { defineEvent } from './base-event.js';
import { versionedTopic } from './versioning.js';

export const MEDIA_EVENTS_TOPIC = versionedTopic('media.events', 1);
/** Companion topics for the retry ladder documented in the README's topic table. */
export const MEDIA_RETRY_10S_TOPIC = `${MEDIA_EVENTS_TOPIC}.retry.10s`;
export const MEDIA_RETRY_1M_TOPIC = `${MEDIA_EVENTS_TOPIC}.retry.1m`;
export const MEDIA_DLQ_TOPIC = `${MEDIA_EVENTS_TOPIC}.dlq`;

const mediaFieldsSchema = z.object({
  id: z.string().uuid(),
  listingId: z.string().uuid(),
  ownerId: z.string().uuid(),
  originalKey: z.string().min(1),
});

/** Published on `media.events.v1` (and, for 'failed', on `media.events.v1.dlq` -- same shape, different topic). */
export const mediaEventPayloadSchema = z.discriminatedUnion('type', [
  mediaFieldsSchema.extend({ type: z.literal('uploaded') }),
  mediaFieldsSchema.extend({ type: z.literal('processed'), previewKey: z.string().min(1) }),
  mediaFieldsSchema.extend({ type: z.literal('failed'), reason: z.string() }),
]);
export type MediaEventPayload = z.infer<typeof mediaEventPayloadSchema>;

export const mediaEventSchema = defineEvent(mediaEventPayloadSchema);
export type MediaEvent = z.infer<typeof mediaEventSchema>;

/** Published on `media.events.v1.retry.10s` / `.retry.1m` -- carries when the retry consumer should actually act. */
export const mediaRetryPayloadSchema = mediaFieldsSchema.extend({
  retryAfter: z.string().datetime(),
});
export type MediaRetryPayload = z.infer<typeof mediaRetryPayloadSchema>;

export const mediaRetryEventSchema = defineEvent(mediaRetryPayloadSchema);
export type MediaRetryEvent = z.infer<typeof mediaRetryEventSchema>;
