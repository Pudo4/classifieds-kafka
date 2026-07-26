import { createConsumer, type EventConsumer, type EventProducer } from '@classifieds/kafka';
import { MEDIA_EVENTS_TOPIC, mediaEventSchema } from '@classifieds/contracts';
import type pino from 'pino';
import type { MediaServiceConfig } from '../config.js';
import type { MediaRepositoryPort } from '../../application/ports/media-repository.port.js';
import type { ObjectStoragePort } from '../../application/ports/object-storage.port.js';
import type { ImageProcessorPort } from '../../application/ports/image-processor.port.js';
import { processMedia } from '../../application/use-cases/process-media.usecase.js';
import { handleProcessOutcome } from './handle-outcome.js';

const CONSUMER_GROUP = 'media';

export async function startUploadedConsumer(
  config: MediaServiceConfig['kafka'],
  repo: MediaRepositoryPort,
  storage: ObjectStoragePort,
  processor: ImageProcessorPort,
  producer: EventProducer,
  logger: pino.Logger,
): Promise<EventConsumer> {
  const consumer = createConsumer(config, CONSUMER_GROUP);

  await consumer.start([MEDIA_EVENTS_TOPIC], async (message) => {
    const parsed = mediaEventSchema.safeParse(message.value);
    if (!parsed.success) {
      throw new Error(`invalid ${MEDIA_EVENTS_TOPIC} payload: ${parsed.error.message}`);
    }
    if (parsed.data.payload.type !== 'uploaded') return;

    const outcome = await processMedia({ mediaId: parsed.data.payload.id, stage: 'initial' }, repo, storage, processor);
    await handleProcessOutcome(outcome, producer);
    logger.info({ mediaId: parsed.data.payload.id, outcome: outcome.outcome }, 'processed media upload');
  });

  return consumer;
}
