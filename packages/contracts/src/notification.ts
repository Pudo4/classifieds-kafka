import { z } from 'zod';
import { defineEvent } from './base-event.js';
import { versionedTopic } from './versioning.js';

export const NOTIFICATION_REQUESTS_TOPIC = versionedTopic('notification.requests', 1);

/**
 * Several services produce here (moderation decisions today, more later)
 * -- `category` is a deliberately free string, not an enum imported from
 * this package, because that would mean every future producer has to come
 * back and extend a shared type just to add a notification kind. The
 * envelope + these three fields are the entire contract; `notification`
 * doesn't need to understand what a producer's domain event meant, only
 * how to store and deliver a message to a user.
 */
export const notificationRequestPayloadSchema = z.object({
  userId: z.string().uuid(),
  category: z.string().min(1),
  message: z.string().min(1),
});
export type NotificationRequestPayload = z.infer<typeof notificationRequestPayloadSchema>;

export const notificationRequestEventSchema = defineEvent(notificationRequestPayloadSchema);
export type NotificationRequestEvent = z.infer<typeof notificationRequestEventSchema>;
