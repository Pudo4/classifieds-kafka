import { z } from 'zod';
import { defineEvent } from './base-event.js';
import { versionedTopic } from './versioning.js';

export const ENGAGEMENT_EVENTS_TOPIC = versionedTopic('engagement.events', 1);

const listingUserFieldsSchema = z.object({
  listingId: z.string().uuid(),
  userId: z.string().uuid(),
});

/**
 * `viewed` carries a pre-batched increment, not one event per page view --
 * see README phase 5 notes. That's also why it's the one variant without a
 * `userId`: a batch covers views from any number of users.
 */
export const engagementEventPayloadSchema = z.discriminatedUnion('type', [
  listingUserFieldsSchema.extend({ type: z.literal('favorited') }),
  listingUserFieldsSchema.extend({ type: z.literal('unfavorited') }),
  listingUserFieldsSchema.extend({ type: z.literal('responded'), responseId: z.string().uuid(), message: z.string().min(1) }),
  z.object({ type: z.literal('viewed'), listingId: z.string().uuid(), incrementBy: z.number().int().positive() }),
]);
export type EngagementEventPayload = z.infer<typeof engagementEventPayloadSchema>;

export const engagementEventSchema = defineEvent(engagementEventPayloadSchema);
export type EngagementEvent = z.infer<typeof engagementEventSchema>;
