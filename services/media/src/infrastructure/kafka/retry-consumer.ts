import { createConsumer, type EventConsumer, type EventProducer } from '@classifieds/kafka';
import { mediaRetryEventSchema } from '@classifieds/contracts';
import type pino from 'pino';
import type { MediaServiceConfig } from '../config.js';
import type { MediaRepositoryPort } from '../../application/ports/media-repository.port.js';
import type { ObjectStoragePort } from '../../application/ports/object-storage.port.js';
import type { ImageProcessorPort } from '../../application/ports/image-processor.port.js';
import { processMedia } from '../../application/use-cases/process-media.usecase.js';
import { handleProcessOutcome } from './handle-outcome.js';
import type { RetryStage } from '../../domain/retry-policy.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryConsumerOptions {
  topic: string;
  groupId: string;
  stage: Extract<RetryStage, 'retry-10s' | 'retry-1m'>;
}

/**
 * Sleeping inside the handler blocks this consumer's partition for up to
 * a minute (the `retry-1m` case) -- acceptable at this project's volume,
 * where these topics see occasional messages, not a stream. A production
 * system at real scale would use a scheduled redelivery mechanism instead
 * of holding a consumer thread open; not worth the complexity here.
 */
export async function startRetryConsumer(
  config: MediaServiceConfig['kafka'],
  options: RetryConsumerOptions,
  repo: MediaRepositoryPort,
  storage: ObjectStoragePort,
  processor: ImageProcessorPort,
  producer: EventProducer,
  logger: pino.Logger,
): Promise<EventConsumer> {
  const consumer = createConsumer(config, options.groupId);

  await consumer.start([options.topic], async (message) => {
    const parsed = mediaRetryEventSchema.safeParse(message.value);
    if (!parsed.success) {
      throw new Error(`invalid ${options.topic} payload: ${parsed.error.message}`);
    }

    const waitMs = new Date(parsed.data.payload.retryAfter).getTime() - Date.now();
    if (waitMs > 0) await sleep(waitMs);

    const outcome = await processMedia(
      { mediaId: parsed.data.payload.id, stage: options.stage },
      repo,
      storage,
      processor,
    );
    await handleProcessOutcome(outcome, producer);
    logger.info(
      { mediaId: parsed.data.payload.id, stage: options.stage, outcome: outcome.outcome },
      'retried media processing',
    );
  });

  return consumer;
}
