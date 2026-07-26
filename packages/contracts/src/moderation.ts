import { z } from 'zod';
import { defineEvent } from './base-event.js';
import { versionedTopic } from './versioning.js';

export const MODERATION_DECISIONS_TOPIC = versionedTopic('moderation.decisions', 1);

export const moderationVerdictSchema = z.enum(['approved', 'rejected']);
export type ModerationVerdict = z.infer<typeof moderationVerdictSchema>;

export const moderationDecisionPayloadSchema = z
  .object({
    listingId: z.string().uuid(),
    verdict: moderationVerdictSchema,
    // Always present for 'rejected', always null for 'approved' -- not
    // optional, so consumers can't forget to handle the rejected case.
    reason: z.string().nullable(),
  })
  .refine((data) => (data.verdict === 'rejected' ? data.reason !== null : data.reason === null), {
    message: 'reason must be a non-null string for a rejected verdict, and null for an approved one',
  });
export type ModerationDecisionPayload = z.infer<typeof moderationDecisionPayloadSchema>;

export const moderationDecisionEventSchema = defineEvent(moderationDecisionPayloadSchema);
export type ModerationDecisionEvent = z.infer<typeof moderationDecisionEventSchema>;
