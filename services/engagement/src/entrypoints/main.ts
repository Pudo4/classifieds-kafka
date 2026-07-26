import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createProducer, onShutdownSignal } from '@classifieds/kafka';
import { OutboxRelayer } from '@classifieds/outbox';
import { createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { createDb } from '../infrastructure/drizzle/db.js';
import { DrizzleViewRepository } from '../infrastructure/drizzle/view-repository.js';
import { createRedisClient } from '../infrastructure/redis/client.js';
import { RedisViewBuffer } from '../infrastructure/redis/view-buffer.js';
import { flushViewBatches } from '../application/use-cases/flush-view-batches.usecase.js';
import { EngagementModule } from './engagement.module.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('engagement');

  const app = await NestFactory.create(EngagementModule, { bufferLogs: true });
  await app.listen(config.httpPort);
  logger.info({ port: config.httpPort }, 'engagement HTTP server started');

  // This is "batched, not per-view" made real: recordView() only ever
  // touches Redis (see application/use-cases/record-view.usecase.ts); this
  // timer is the one and only place Postgres and Kafka hear about views.
  const viewBuffer = new RedisViewBuffer(createRedisClient(config.redis));
  const viewRepo = new DrizzleViewRepository(createDb(config.db));
  const runFlush = (): void => {
    flushViewBatches(viewBuffer, viewRepo)
      .then((flushedCount) => {
        if (flushedCount > 0) logger.info({ listingsFlushed: flushedCount }, 'flushed view batches');
      })
      .catch((error: unknown) => logger.error({ err: error }, 'view batch flush failed'));
  };
  const flushTimer = setInterval(runFlush, config.viewFlushIntervalMs);
  logger.info({ intervalMs: config.viewFlushIntervalMs }, 'view batch flush timer started');

  const producer = createProducer({ brokers: config.kafka.brokers, clientId: config.kafka.clientId });
  const relayer = new OutboxRelayer({
    db: createDb(config.db),
    producer,
    onError: (error) => logger.error({ err: error }, 'outbox relay failed'),
  });
  relayer.start();
  logger.info('outbox relayer started');

  onShutdownSignal(async () => {
    logger.info('shutting down');
    clearInterval(flushTimer);
    await flushViewBatches(viewBuffer, viewRepo).catch((error: unknown) =>
      logger.error({ err: error }, 'final view batch flush failed'),
    );
    await relayer.stop();
    await producer.disconnect();
    await app.close();
  });
}

bootstrap().catch((error: unknown) => {
  console.error('engagement service failed to start', error);
  process.exit(1);
});
