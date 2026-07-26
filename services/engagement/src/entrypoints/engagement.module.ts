import { Module, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, createHealthController, createLogger } from '@classifieds/platform';
import { FAVORITE_REPOSITORY } from '../application/ports/favorite-repository.port.js';
import { RESPONSE_REPOSITORY } from '../application/ports/response-repository.port.js';
import { VIEW_BUFFER } from '../application/ports/view-buffer.port.js';
import { VIEW_REPOSITORY } from '../application/ports/view-repository.port.js';
import { loadConfig } from '../infrastructure/config.js';
import { createDb, type Db } from '../infrastructure/drizzle/db.js';
import { DrizzleFavoriteRepository } from '../infrastructure/drizzle/favorite-repository.js';
import { DrizzleResponseRepository } from '../infrastructure/drizzle/response-repository.js';
import { DrizzleViewRepository } from '../infrastructure/drizzle/view-repository.js';
import { createRedisClient } from '../infrastructure/redis/client.js';
import { RedisViewBuffer } from '../infrastructure/redis/view-buffer.js';
import { FavoritesController } from './presentation/favorites.controller.js';
import { ResponsesController } from './presentation/responses.controller.js';
import { ViewsController } from './presentation/views.controller.js';
import { EngagementService } from './engagement.service.js';

const config = loadConfig();
const logger = createLogger('engagement');

const dbProvider: Provider = {
  provide: 'ENGAGEMENT_DB',
  useFactory: (): Db => createDb(config.db),
};

const favoriteRepositoryProvider: Provider = {
  provide: FAVORITE_REPOSITORY,
  inject: ['ENGAGEMENT_DB'],
  useFactory: (db: Db) => new DrizzleFavoriteRepository(db),
};

const responseRepositoryProvider: Provider = {
  provide: RESPONSE_REPOSITORY,
  inject: ['ENGAGEMENT_DB'],
  useFactory: (db: Db) => new DrizzleResponseRepository(db),
};

const viewRepositoryProvider: Provider = {
  provide: VIEW_REPOSITORY,
  inject: ['ENGAGEMENT_DB'],
  useFactory: (db: Db) => new DrizzleViewRepository(db),
};

const viewBufferProvider: Provider = {
  provide: VIEW_BUFFER,
  useFactory: () => new RedisViewBuffer(createRedisClient(config.redis)),
};

const loggerProvider: Provider = {
  provide: AllExceptionsFilter,
  useFactory: () => new AllExceptionsFilter(logger),
};

@Module({
  controllers: [FavoritesController, ResponsesController, ViewsController, createHealthController('engagement')],
  providers: [
    dbProvider,
    favoriteRepositoryProvider,
    responseRepositoryProvider,
    viewRepositoryProvider,
    viewBufferProvider,
    EngagementService,
    loggerProvider,
    { provide: APP_FILTER, useExisting: AllExceptionsFilter },
  ],
})
export class EngagementModule {}
