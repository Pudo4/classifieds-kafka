import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngagementHttpClient } from '../../infrastructure/http/engagement-http-client.js';
import type { FavoriteSummary } from '../../application/ports/engagement-client.port.js';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly engagementClient: EngagementHttpClient) {}

  @Post()
  add(@Body('listingId') listingId: string, @CurrentUserId() userId: string): Promise<FavoriteSummary> {
    return this.engagementClient.addFavorite(userId, listingId);
  }

  @Delete(':listingId')
  @HttpCode(204)
  remove(@Param('listingId') listingId: string, @CurrentUserId() userId: string): Promise<void> {
    return this.engagementClient.removeFavorite(userId, listingId);
  }

  @Get('mine')
  listMine(@CurrentUserId() userId: string): Promise<FavoriteSummary[]> {
    return this.engagementClient.listMyFavorites(userId);
  }
}
