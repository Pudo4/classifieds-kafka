import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { onShutdownSignal } from '@classifieds/kafka';
import { createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { createMeiliClient } from '../infrastructure/meilisearch/client.js';
import { ensureIndex } from '../infrastructure/meilisearch/ensure-index.js';
import { MeilisearchIndex } from '../infrastructure/meilisearch/meilisearch-index.js';
import { startSnapshotConsumer } from '../infrastructure/kafka/snapshot-consumer.js';
import { SearchModule } from './search.module.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('search');

  const meiliClient = createMeiliClient(config.meili);
  await ensureIndex(meiliClient, config.meili.indexName);
  logger.info({ index: config.meili.indexName }, 'meilisearch index ready');

  const app = await NestFactory.create(SearchModule, { bufferLogs: true });
  await app.listen(config.httpPort);
  logger.info({ port: config.httpPort }, 'search HTTP server started');

  const index = new MeilisearchIndex(meiliClient, config.meili.indexName);
  const consumer = await startSnapshotConsumer(config.kafka, index, logger);
  logger.info('listing.snapshot.v1 consumer started');

  onShutdownSignal(async () => {
    logger.info('shutting down');
    await consumer.shutdown();
    await app.close();
  });
}

bootstrap().catch((error: unknown) => {
  console.error('search service failed to start', error);
  process.exit(1);
});
