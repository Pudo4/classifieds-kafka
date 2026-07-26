import { createConsumer, type EventConsumer } from '@classifieds/kafka';
import { LISTING_SNAPSHOT_TOPIC, listingSnapshotEventSchema } from '@classifieds/contracts';
import type pino from 'pino';
import type { SearchConfig } from '../config.js';
import type { SearchIndexPort } from '../../application/ports/search-index.port.js';
import { applyListingSnapshot, type IncomingSnapshot } from '../../application/use-cases/apply-listing-snapshot.usecase.js';

const CONSUMER_GROUP = 'search';

export async function startSnapshotConsumer(
  config: SearchConfig['kafka'],
  index: SearchIndexPort,
  logger: pino.Logger,
): Promise<EventConsumer> {
  const consumer = createConsumer(config, CONSUMER_GROUP, {
    // `listing.snapshot.v1` is compacted: a fresh `search` (or one replaying
    // after an index wipe) must read the full compacted history to rebuild
    // the index, not just whatever gets produced after it happens to start.
    fromBeginning: true,
  });

  await consumer.start([LISTING_SNAPSHOT_TOPIC], async (message) => {
    if (!message.key) {
      throw new Error(`received a ${LISTING_SNAPSHOT_TOPIC} message without a key -- cannot index it`);
    }

    if (message.value === null) {
      await applyListingSnapshot(message.key, { kind: 'delete' }, index);
      return;
    }

    const parsed = listingSnapshotEventSchema.safeParse(message.value);
    if (!parsed.success) {
      throw new Error(`invalid ${LISTING_SNAPSHOT_TOPIC} payload for key ${message.key}: ${parsed.error.message}`);
    }

    const incoming: IncomingSnapshot = {
      kind: 'upsert',
      version: parsed.data.version,
      document: { ...parsed.data.payload, version: parsed.data.version },
    };
    await applyListingSnapshot(message.key, incoming, index);
    logger.debug({ listingId: message.key, version: parsed.data.version }, 'applied listing snapshot');
  });

  return consumer;
}
