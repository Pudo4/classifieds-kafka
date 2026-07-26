import { randomUUID } from 'node:crypto';
import { MEDIA_RETRY_10S_TOPIC, MEDIA_RETRY_1M_TOPIC, mediaRetryEventSchema } from '@classifieds/contracts';
import type { EventProducer } from '@classifieds/kafka';
import type { ProcessOutcome } from '../../application/use-cases/process-media.usecase.js';

/**
 * Only the 'retry' outcome needs action here -- 'processed' and 'dlq'
 * already published through the outbox inside `processMedia()`'s
 * `repo.save()` call, atomic with the DB write. A pure "not resolved yet,
 * try again later" signal has no accompanying state change, so producing
 * it directly (no outbox) is a deliberate, reasoned choice, not an
 * oversight -- see README phase 4 notes.
 */
export async function handleProcessOutcome(outcome: ProcessOutcome, producer: EventProducer): Promise<void> {
  if (outcome.outcome !== 'retry') return;

  const snapshot = outcome.asset.toSnapshot();
  const topic = outcome.stage === 'retry-10s' ? MEDIA_RETRY_10S_TOPIC : MEDIA_RETRY_1M_TOPIC;
  const payload = mediaRetryEventSchema.parse({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    version: 1,
    producer: 'media',
    payload: {
      id: snapshot.id,
      listingId: snapshot.listingId,
      ownerId: snapshot.ownerId,
      originalKey: snapshot.originalKey,
      retryAfter: new Date(Date.now() + outcome.delayMs).toISOString(),
    },
  });

  await producer.publish({ topic, key: snapshot.id, value: payload });
}
