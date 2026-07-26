import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createProducer, onShutdownSignal } from '@classifieds/kafka';
import { OutboxRelayer } from '@classifieds/outbox';
import { createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { createDb } from '../infrastructure/drizzle/db.js';
import { DrizzleModerationRepository } from '../infrastructure/drizzle/moderation-repository.js';
import { startListingEventsConsumer } from '../infrastructure/kafka/listing-events-consumer.js';
import { ModerationModule } from './moderation.module.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('moderation');

  const app = await NestFactory.create(ModerationModule, { bufferLogs: true });
  await app.listen(config.httpPort);
  logger.info({ port: config.httpPort }, 'moderation HTTP server started');

  // Separate connection from the relayer's -- consuming and relaying are
  // independent workloads and shouldn't contend for the same pool slots.
  const repo = new DrizzleModerationRepository(createDb(config.db));
  const listingConsumer = await startListingEventsConsumer(config.kafka, repo, logger);
  logger.info('listing.events.v1 consumer started');

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
    await listingConsumer.shutdown();
    await relayer.stop();
    await producer.disconnect();
    await app.close();
  });
}

bootstrap().catch((error: unknown) => {
  console.error('moderation service failed to start', error);
  process.exit(1);
});
