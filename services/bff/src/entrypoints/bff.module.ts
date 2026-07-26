import { Module, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, createHealthController, createLogger } from '@classifieds/platform';
import { loadConfig } from '../infrastructure/config.js';
import { ListingHttpClient } from '../infrastructure/http/listing-http-client.js';
import { MediaHttpClient } from '../infrastructure/http/media-http-client.js';
import { EngagementHttpClient } from '../infrastructure/http/engagement-http-client.js';
import { SearchHttpClient } from '../infrastructure/http/search-http-client.js';
import { NotificationHttpClient } from '../infrastructure/http/notification-http-client.js';
import { ListingsController } from './presentation/listings.controller.js';
import { MediaController } from './presentation/media.controller.js';
import { FavoritesController } from './presentation/favorites.controller.js';
import { ResponsesController } from './presentation/responses.controller.js';
import { ViewsController } from './presentation/views.controller.js';
import { SearchController } from './presentation/search.controller.js';
import { NotificationsController } from './presentation/notifications.controller.js';

const config = loadConfig();
const logger = createLogger('bff');

// Class-token providers: each upstream has exactly one implementation, so
// there's no need for a Symbol token + separate interface binding the way
// every other service does for its repository -- Nest resolves these by
// type the same way it resolves any other constructor dependency.
const listingClientProvider: Provider = {
  provide: ListingHttpClient,
  useFactory: () => new ListingHttpClient(config.services.listing),
};
const mediaClientProvider: Provider = {
  provide: MediaHttpClient,
  useFactory: () => new MediaHttpClient(config.services.media),
};
const engagementClientProvider: Provider = {
  provide: EngagementHttpClient,
  useFactory: () => new EngagementHttpClient(config.services.engagement),
};
const searchClientProvider: Provider = {
  provide: SearchHttpClient,
  useFactory: () => new SearchHttpClient(config.services.search),
};
const notificationClientProvider: Provider = {
  provide: NotificationHttpClient,
  useFactory: () => new NotificationHttpClient(config.services.notification),
};

const loggerProvider: Provider = {
  provide: AllExceptionsFilter,
  useFactory: () => new AllExceptionsFilter(logger),
};

@Module({
  controllers: [
    ListingsController,
    MediaController,
    FavoritesController,
    ResponsesController,
    ViewsController,
    SearchController,
    NotificationsController,
    createHealthController('bff'),
  ],
  providers: [
    listingClientProvider,
    mediaClientProvider,
    engagementClientProvider,
    searchClientProvider,
    notificationClientProvider,
    loggerProvider,
    { provide: APP_FILTER, useExisting: AllExceptionsFilter },
  ],
})
export class BffModule {}
