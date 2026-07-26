import { createConsumer, type EventConsumer } from '@classifieds/kafka';
import { LISTING_EVENTS_TOPIC, listingEventSchema } from '@classifieds/contracts';
import type pino from 'pino';
import type { ModerationServiceConfig } from '../config.js';
import type { ModerationRepositoryPort } from '../../application/ports/moderation-repository.port.js';
import { reviewSubmittedListing } from '../../application/use-cases/review-submitted-listing.usecase.js';

const CONSUMER_GROUP = 'moderation';

/**
 * Unlike `search`, this doesn't set `fromBeginning` -- `listing.events.v1`
 * is a plain retention log, not compacted, and moderation's job is to
 * react to submissions as they happen, not backfill a read-model from
 * history. A listing that was already `pending` before this consumer's
 * first boot only gets reviewed once it's (re)submitted.
 */
export async function startListingEventsConsumer(
  config: ModerationServiceConfig['kafka'],
  repo: ModerationRepositoryPort,
  logger: pino.Logger,
): Promise<EventConsumer> {
  const consumer = createConsumer(config, CONSUMER_GROUP);

  await consumer.start([LISTING_EVENTS_TOPIC], async (message) => {
    const parsed = listingEventSchema.safeParse(message.value);
    if (!parsed.success) {
      throw new Error(`invalid ${LISTING_EVENTS_TOPIC} payload: ${parsed.error.message}`);
    }
    if (parsed.data.payload.type !== 'submitted') return;

    const decision = await reviewSubmittedListing(
      {
        sourceEventId: parsed.data.eventId,
        submission: {
          listingId: parsed.data.payload.id,
          ownerId: parsed.data.payload.ownerId,
          title: parsed.data.payload.title,
          description: parsed.data.payload.description,
          priceCents: parsed.data.payload.priceCents,
        },
      },
      repo,
    );

    if (decision) {
      logger.info({ listingId: decision.listingId, verdict: decision.verdict }, 'reviewed submitted listing');
    }
  });

  return consumer;
}
