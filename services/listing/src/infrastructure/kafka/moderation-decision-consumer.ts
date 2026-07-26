import { createConsumer, type EventConsumer } from '@classifieds/kafka';
import { MODERATION_DECISIONS_TOPIC, moderationDecisionEventSchema } from '@classifieds/contracts';
import type pino from 'pino';
import type { ListingConfig } from '../config.js';
import type { ListingRepositoryPort } from '../../application/ports/listing-repository.port.js';
import { applyModerationDecision } from '../../application/use-cases/apply-moderation-decision.usecase.js';

const CONSUMER_GROUP = 'listing';

export async function startModerationDecisionConsumer(
  config: ListingConfig['kafka'],
  repo: ListingRepositoryPort,
  logger: pino.Logger,
): Promise<EventConsumer> {
  const consumer = createConsumer(config, CONSUMER_GROUP);

  await consumer.start([MODERATION_DECISIONS_TOPIC], async (message) => {
    const parsed = moderationDecisionEventSchema.safeParse(message.value);
    if (!parsed.success) {
      throw new Error(`invalid ${MODERATION_DECISIONS_TOPIC} payload: ${parsed.error.message}`);
    }

    const applied = await applyModerationDecision(
      {
        listingId: parsed.data.payload.listingId,
        sourceEventId: parsed.data.eventId,
        verdict: parsed.data.payload.verdict,
        reason: parsed.data.payload.reason,
      },
      repo,
    );

    if (applied) {
      logger.info(
        { listingId: parsed.data.payload.listingId, verdict: parsed.data.payload.verdict },
        'applied moderation decision',
      );
    }
  });

  return consumer;
}
