import { Module, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, createHealthController, createLogger } from '@classifieds/platform';
import { SEARCH_INDEX } from '../application/ports/search-index.port.js';
import { loadConfig } from '../infrastructure/config.js';
import { createMeiliClient } from '../infrastructure/meilisearch/client.js';
import { MeilisearchIndex } from '../infrastructure/meilisearch/meilisearch-index.js';
import { SearchController } from './presentation/search.controller.js';
import { SearchService } from './search.service.js';

const config = loadConfig();
const logger = createLogger('search');

const indexProvider: Provider = {
  provide: SEARCH_INDEX,
  useFactory: () => new MeilisearchIndex(createMeiliClient(config.meili), config.meili.indexName),
};

const loggerProvider: Provider = {
  provide: AllExceptionsFilter,
  useFactory: () => new AllExceptionsFilter(logger),
};

@Module({
  controllers: [SearchController, createHealthController('search')],
  providers: [indexProvider, SearchService, loggerProvider, { provide: APP_FILTER, useExisting: AllExceptionsFilter }],
})
export class SearchModule {}
