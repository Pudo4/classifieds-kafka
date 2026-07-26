import { Module, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, createHealthController, createLogger } from '@classifieds/platform';
import { NOTIFICATION_REPOSITORY } from '../application/ports/notification-repository.port.js';
import { NOTIFICATION_BUS } from '../application/ports/notification-bus.port.js';
import { loadConfig } from '../infrastructure/config.js';
import { createDb, type Db } from '../infrastructure/drizzle/db.js';
import { DrizzleNotificationRepository } from '../infrastructure/drizzle/notification-repository.js';
import { InProcessNotificationBus } from '../infrastructure/bus/in-process-notification-bus.js';
import { NotificationsController } from './presentation/notifications.controller.js';
import { NotificationService } from './notification.service.js';

const config = loadConfig();
const logger = createLogger('notification');

// One shared instance across the whole process -- the Kafka consumer
// publishes to it (see main.ts) and every SSE connection subscribes to
// the same instance, which is what makes "consumer writes, controller
// reads" work without any extra plumbing between the two.
const bus = new InProcessNotificationBus();

const dbProvider: Provider = {
  provide: 'NOTIFICATION_DB',
  useFactory: (): Db => createDb(config.db),
};

const repositoryProvider: Provider = {
  provide: NOTIFICATION_REPOSITORY,
  inject: ['NOTIFICATION_DB'],
  useFactory: (db: Db) => new DrizzleNotificationRepository(db),
};

const busProvider: Provider = {
  provide: NOTIFICATION_BUS,
  useValue: bus,
};

const loggerProvider: Provider = {
  provide: AllExceptionsFilter,
  useFactory: () => new AllExceptionsFilter(logger),
};

@Module({
  controllers: [NotificationsController, createHealthController('notification')],
  providers: [
    dbProvider,
    repositoryProvider,
    busProvider,
    NotificationService,
    loggerProvider,
    { provide: APP_FILTER, useExisting: AllExceptionsFilter },
  ],
})
export class NotificationModule {}

export { bus as sharedNotificationBus };
