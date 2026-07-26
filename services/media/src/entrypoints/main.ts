import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MEDIA_RETRY_10S_TOPIC, MEDIA_RETRY_1M_TOPIC } from '@classifieds/contracts';
import { createProducer, onShutdownSignal } from '@classifieds/kafka';
import { OutboxRelayer } from '@classifieds/outbox';
import { createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { createDb } from '../infrastructure/drizzle/db.js';
import { DrizzleMediaRepository } from '../infrastructure/drizzle/media-repository.js';
import { createMinioClient, ensureBucket } from '../infrastructure/minio/client.js';
import { MinioObjectStorage } from '../infrastructure/minio/object-storage.js';
import { SharpImageProcessor } from '../infrastructure/sharp/image-processor.js';
import { startUploadedConsumer } from '../infrastructure/kafka/uploaded-consumer.js';
import { startRetryConsumer } from '../infrastructure/kafka/retry-consumer.js';
import { MediaModule } from './media.module.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('media');

  const minioClient = createMinioClient(config.minio);
  await ensureBucket(minioClient, config.minio.bucket);
  logger.info({ bucket: config.minio.bucket }, 'minio bucket ready');

  const app = await NestFactory.create(MediaModule, { bufferLogs: true });
  await app.listen(config.httpPort);
  logger.info({ port: config.httpPort }, 'media HTTP server started');

  // Each consumer gets its own repo/storage instance (its own DB pool),
  // same reasoning as every other service's main.ts: independent
  // workloads shouldn't contend for the same connections.
  const processor = new SharpImageProcessor();
  const producer = createProducer({ brokers: config.kafka.brokers, clientId: config.kafka.clientId });

  const uploadedConsumer = await startUploadedConsumer(
    config.kafka,
    new DrizzleMediaRepository(createDb(config.db)),
    new MinioObjectStorage(minioClient, config.minio.bucket),
    processor,
    producer,
    logger,
  );
  logger.info('media.events.v1 (uploaded) consumer started');

  const retry10sConsumer = await startRetryConsumer(
    config.kafka,
    { topic: MEDIA_RETRY_10S_TOPIC, groupId: 'media-retry-10s', stage: 'retry-10s' },
    new DrizzleMediaRepository(createDb(config.db)),
    new MinioObjectStorage(minioClient, config.minio.bucket),
    processor,
    producer,
    logger,
  );
  logger.info('media.events.v1.retry.10s consumer started');

  const retry1mConsumer = await startRetryConsumer(
    config.kafka,
    { topic: MEDIA_RETRY_1M_TOPIC, groupId: 'media-retry-1m', stage: 'retry-1m' },
    new DrizzleMediaRepository(createDb(config.db)),
    new MinioObjectStorage(minioClient, config.minio.bucket),
    processor,
    producer,
    logger,
  );
  logger.info('media.events.v1.retry.1m consumer started');

  const relayer = new OutboxRelayer({
    db: createDb(config.db),
    producer,
    onError: (error) => logger.error({ err: error }, 'outbox relay failed'),
  });
  relayer.start();
  logger.info('outbox relayer started');

  onShutdownSignal(async () => {
    logger.info('shutting down');
    await uploadedConsumer.shutdown();
    await retry10sConsumer.shutdown();
    await retry1mConsumer.shutdown();
    await relayer.stop();
    await producer.disconnect();
    await app.close();
  });
}

bootstrap().catch((error: unknown) => {
  console.error('media service failed to start', error);
  process.exit(1);
});
