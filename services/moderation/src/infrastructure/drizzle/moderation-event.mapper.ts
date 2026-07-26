import { randomUUID } from 'node:crypto';
import { MODERATION_DECISIONS_TOPIC, moderationDecisionEventSchema, NOTIFICATION_REQUESTS_TOPIC, notificationRequestEventSchema } from '@classifieds/contracts';
import type { OutboxMessage } from '@classifieds/outbox';
import type { ModerationDecision } from '../../domain/moderation-decision.js';

export function mapDecisionToOutboxMessage(decision: ModerationDecision): OutboxMessage {
  const envelope = moderationDecisionEventSchema.parse({
    eventId: randomUUID(),
    occurredAt: decision.checkedAt.toISOString(),
    // Decisions are standalone facts, not a versioned mutable aggregate --
    // there's nothing for this field to track across multiple decisions
    // for the same listing (each carries its own fresh eventId, and
    // consumers dedup via processed_events, not a version check).
    version: 1,
    producer: 'moderation',
    payload: {
      listingId: decision.listingId,
      verdict: decision.verdict,
      reason: decision.reason,
    },
  });

  return {
    aggregateId: decision.listingId,
    topic: MODERATION_DECISIONS_TOPIC,
    eventKey: decision.listingId,
    payload: envelope,
  };
}

/**
 * moderation is one of "several" producers on notification.requests.v1
 * (see packages/contracts/src/notification.ts) -- this is the other half
 * of the same decision, addressed to the listing's owner instead of the
 * listing itself, published atomically alongside it.
 */
export function mapDecisionToNotificationOutboxMessage(
  decision: ModerationDecision,
  ownerId: string,
  listingTitle: string,
): OutboxMessage {
  const message =
    decision.verdict === 'approved'
      ? `Объявление «${listingTitle}» прошло модерацию и опубликовано`
      : `Объявление «${listingTitle}» отклонено: ${decision.reason ?? 'без указанной причины'}`;

  const envelope = notificationRequestEventSchema.parse({
    eventId: randomUUID(),
    occurredAt: decision.checkedAt.toISOString(),
    version: 1,
    producer: 'moderation',
    payload: {
      userId: ownerId,
      category: `listing.${decision.verdict}`,
      message,
    },
  });

  return {
    aggregateId: decision.listingId,
    topic: NOTIFICATION_REQUESTS_TOPIC,
    eventKey: ownerId,
    payload: envelope,
  };
}
