import { Module, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, createHealthController, createLogger } from '@classifieds/platform';
import { MEDIA_REPOSITORY } from '../application/ports/media-repository.port.js';
import { OBJECT_STORAGE } from '../application/ports/object-storage.port.js';
import { loadConfig } from '../infrastructure/config.js';
import { createDb, type Db } from '../infrastructure/drizzle/db.js';
import { DrizzleMediaRepository } from '../infrastructure/drizzle/media-repository.js';
import { createMinioClient } from '../infrastructure/minio/client.js';
import { MinioObjectStorage } from '../infrastructure/minio/object-storage.js';
import { MediaController } from './presentation/media.controller.js';
import { MediaService } from './media.service.js';

const config = loadConfig();
const logger = createLogger('media');

const dbProvider: Provider = {
  provide: 'MEDIA_DB',
  useFactory: (): Db => createDb(config.db),
};

const repositoryProvider: Provider = {
  provide: MEDIA_REPOSITORY,
  inject: ['MEDIA_DB'],
  useFactory: (db: Db) => new DrizzleMediaRepository(db),
};

const storageProvider: Provider = {
  provide: OBJECT_STORAGE,
  useFactory: () => new MinioObjectStorage(createMinioClient(config.minio), config.minio.bucket),
};

const loggerProvider: Provider = {
  provide: AllExceptionsFilter,
  useFactory: () => new AllExceptionsFilter(logger),
};

@Module({
  controllers: [MediaController, createHealthController('media')],
  providers: [
    dbProvider,
    repositoryProvider,
    storageProvider,
    MediaService,
    loggerProvider,
    { provide: APP_FILTER, useExisting: AllExceptionsFilter },
  ],
})
export class MediaModule {}
