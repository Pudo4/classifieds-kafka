import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createProducer, onShutdownSignal } from '@classifieds/kafka';
import { OutboxRelayer } from '@classifieds/outbox';
import { createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { createDb } from '../infrastructure/drizzle/db.js';
import { DrizzleListingRepository } from '../infrastructure/drizzle/listing-repository.js';
import { startModerationDecisionConsumer } from '../infrastructure/kafka/moderation-decision-consumer.js';
import { ListingModule } from './listing.module.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('listing');

  const app = await NestFactory.create(ListingModule, { bufferLogs: true });
  await app.listen(config.httpPort);
  logger.info({ port: config.httpPort }, 'listing HTTP server started');

  // Each independent workload (HTTP requests, the relayer, the decision
  // consumer) gets its own connection so they don't contend for pool slots.
  const decisionRepo = new DrizzleListingRepository(createDb(config.db));
  const decisionConsumer = await startModerationDecisionConsumer(config.kafka, decisionRepo, logger);
  logger.info('moderation.decisions.v1 consumer started');

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
    await decisionConsumer.shutdown();
    await relayer.stop();
    await producer.disconnect();
    await app.close();
  });
}

bootstrap().catch((error: unknown) => {
  console.error('listing service failed to start', error);
  process.exit(1);
});
