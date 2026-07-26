import { Module, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, createHealthController, createLogger } from '@classifieds/platform';

const logger = createLogger('moderation');

const loggerProvider: Provider = {
  provide: AllExceptionsFilter,
  useFactory: () => new AllExceptionsFilter(logger),
};

/**
 * No repository provider here: unlike `listing`, nothing in this service's
 * HTTP surface (just `/health`) needs one -- the repository the Kafka
 * consumer uses is constructed directly in `main.ts`, not resolved
 * through Nest DI, because there's nothing in the DI graph to inject it
 * into.
 */
@Module({
  controllers: [createHealthController('moderation')],
  providers: [loggerProvider, { provide: APP_FILTER, useExisting: AllExceptionsFilter }],
})
export class ModerationModule {}
