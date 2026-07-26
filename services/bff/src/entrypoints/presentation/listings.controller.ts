import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '@classifieds/platform';
// All three must stay value imports: Nest's `emitDecoratorMetadata` needs
// the real class references to populate `design:paramtypes` for
// constructor DI.
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { ListingHttpClient } from '../../infrastructure/http/listing-http-client.js';
import { MediaHttpClient } from '../../infrastructure/http/media-http-client.js';
import { EngagementHttpClient } from '../../infrastructure/http/engagement-http-client.js';
/* eslint-enable @typescript-eslint/consistent-type-imports */
import { getListingCard } from '../../application/use-cases/get-listing-card.usecase.js';
import type { CreateListingBody, UpdateListingBody } from '../../application/ports/listing-client.port.js';
import type { ListingCard } from '../../domain/listing-card.js';
import type { ListingSummary } from '../../domain/listing-card.js';

/**
 * `create`/`update` don't re-validate the body -- `listing` already does,
 * and duplicating that schema here would just be two places that can
 * drift out of sync. A malformed body rides through as a 400 from
 * `listing`, propagated by `UpstreamServiceError`. Only `:id/card` has
 * real logic (see get-listing-card.usecase.ts); everything else here is
 * a direct, intentionally thin proxy.
 */
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingClient: ListingHttpClient,
    private readonly mediaClient: MediaHttpClient,
    private readonly engagementClient: EngagementHttpClient,
  ) {}

  @Post()
  create(@Body() body: CreateListingBody, @CurrentUserId() userId: string): Promise<ListingSummary> {
    return this.listingClient.create(userId, body);
  }

  @Get('mine')
  listMine(@CurrentUserId() userId: string): Promise<ListingSummary[]> {
    return this.listingClient.listMine(userId);
  }

  @Get(':id/card')
  getCard(@Param('id') listingId: string, @CurrentUserId() userId: string): Promise<ListingCard> {
    return getListingCard(userId, listingId, this.listingClient, this.mediaClient, this.engagementClient);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateListingBody, @CurrentUserId() userId: string): Promise<ListingSummary> {
    return this.listingClient.update(userId, id, body);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUserId() userId: string): Promise<ListingSummary> {
    return this.listingClient.submit(userId, id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUserId() userId: string): Promise<ListingSummary> {
    return this.listingClient.archive(userId, id);
  }
}
