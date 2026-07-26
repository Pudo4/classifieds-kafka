import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { BffModule } from './bff.module.js';

/**
 * No Kafka, no outbox relayer, no DB -- unlike every other service, `bff`
 * doesn't own any data or produce/consume events. It's a synchronous
 * aggregator in front of the others, so its startup is just "listen".
 */
async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('bff');

  const app = await NestFactory.create(BffModule, { bufferLogs: true });
  // Permissive by design: there's no cookie/session auth to protect against
  // CSRF here (identity is a plain X-User-Id header, see CurrentUserId),
  // so reflecting any origin costs nothing and keeps the Vite dev server
  // (a different origin/port) working without a maintained allowlist.
  app.enableCors();
  await app.listen(config.httpPort);
  logger.info({ port: config.httpPort }, 'bff HTTP server started');
}

bootstrap().catch((error: unknown) => {
  console.error('bff service failed to start', error);
  process.exit(1);
});
