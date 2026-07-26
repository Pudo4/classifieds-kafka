import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '@classifieds/platform';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- see listing.controller.ts for why
import { EngagementService } from '../engagement.service.js';

@Controller('views')
export class ViewsController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post(':listingId')
  @HttpCode(204)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- X-User-Id required for consistency across every endpoint, even though view counting doesn't key on who's viewing
  async record(@Param('listingId') listingId: string, @CurrentUserId() userId: string): Promise<void> {
    await this.engagementService.recordView(listingId);
  }

  @Get(':listingId')
  async getCount(@Param('listingId') listingId: string): Promise<{ listingId: string; viewCount: number }> {
    const viewCount = await this.engagementService.getViewCount(listingId);
    return { listingId, viewCount };
  }
}
