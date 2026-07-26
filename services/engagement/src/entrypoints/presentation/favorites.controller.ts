import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUserId, ZodValidationPipe } from '@classifieds/platform';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- see listing.controller.ts for why
import { EngagementService } from '../engagement.service.js';
import { addFavoriteBodySchema, type AddFavoriteBody } from './dto/favorite.dto.js';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post()
  async add(@Body(new ZodValidationPipe(addFavoriteBodySchema)) body: AddFavoriteBody, @CurrentUserId() userId: string) {
    const favorite = await this.engagementService.addFavorite({ userId, listingId: body.listingId });
    return { userId: favorite.userId, listingId: favorite.listingId, createdAt: favorite.createdAt.toISOString() };
  }

  @Delete(':listingId')
  @HttpCode(204)
  async remove(@Param('listingId') listingId: string, @CurrentUserId() userId: string): Promise<void> {
    await this.engagementService.removeFavorite(userId, listingId);
  }

  @Get('mine')
  async mine(@CurrentUserId() userId: string) {
    const favorites = await this.engagementService.listMyFavorites(userId);
    return favorites.map((f) => ({ userId: f.userId, listingId: f.listingId, createdAt: f.createdAt.toISOString() }));
  }

  @Get('count/:listingId')
  async count(@Param('listingId') listingId: string): Promise<{ listingId: string; favoriteCount: number }> {
    const favoriteCount = await this.engagementService.countFavorites(listingId);
    return { listingId, favoriteCount };
  }
}
