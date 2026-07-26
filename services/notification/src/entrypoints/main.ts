import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { onShutdownSignal } from '@classifieds/kafka';
import { createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { createDb } from '../infrastructure/drizzle/db.js';
import { DrizzleNotificationRepository } from '../infrastructure/drizzle/notification-repository.js';
import { startNotificationRequestsConsumer } from '../infrastructure/kafka/notification-requests-consumer.js';
import { NotificationModule, sharedNotificationBus } from './notification.module.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('notification');

  const app = await NestFactory.create(NotificationModule, { bufferLogs: true });
  await app.listen(config.httpPort);
  logger.info({ port: config.httpPort }, 'notification HTTP server started');

  // No outbox relayer here -- unlike every other service, notification
  // never produces to Kafka. It's a pure sink: consume, persist, push to
  // whichever SSE connections (via the shared bus) are open right now.
  const repo = new DrizzleNotificationRepository(createDb(config.db));
  const consumer = await startNotificationRequestsConsumer(config.kafka, repo, sharedNotificationBus, logger);
  logger.info('notification.requests.v1 consumer started');

  onShutdownSignal(async () => {
    logger.info('shutting down');
    await consumer.shutdown();
    await app.close();
  });
}

bootstrap().catch((error: unknown) => {
  console.error('notification service failed to start', error);
  process.exit(1);
});
