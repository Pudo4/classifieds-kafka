import { Module, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, createHealthController, createLogger } from '@classifieds/platform';
import { LISTING_REPOSITORY } from '../application/ports/listing-repository.port.js';
import { loadConfig } from '../infrastructure/config.js';
import { createDb, type Db } from '../infrastructure/drizzle/db.js';
import { DrizzleListingRepository } from '../infrastructure/drizzle/listing-repository.js';
import { ListingController } from './presentation/listing.controller.js';
import { ListingService } from './listing.service.js';

const config = loadConfig();
const logger = createLogger('listing');

const dbProvider: Provider = {
  provide: 'LISTING_DB',
  useFactory: (): Db => createDb(config.db),
};

const repositoryProvider: Provider = {
  provide: LISTING_REPOSITORY,
  inject: ['LISTING_DB'],
  useFactory: (db: Db) => new DrizzleListingRepository(db),
};

const loggerProvider: Provider = {
  provide: AllExceptionsFilter,
  useFactory: () => new AllExceptionsFilter(logger),
};

@Module({
  controllers: [ListingController, createHealthController('listing')],
  providers: [
    dbProvider,
    repositoryProvider,
    ListingService,
    loggerProvider,
    { provide: APP_FILTER, useExisting: AllExceptionsFilter },
  ],
})
export class ListingModule {}
