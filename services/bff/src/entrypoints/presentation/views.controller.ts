import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngagementHttpClient } from '../../infrastructure/http/engagement-http-client.js';

@Controller('views')
export class ViewsController {
  constructor(private readonly engagementClient: EngagementHttpClient) {}

  @Post(':listingId')
  @HttpCode(204)
  record(@Param('listingId') listingId: string, @CurrentUserId() userId: string): Promise<void> {
    return this.engagementClient.recordView(userId, listingId);
  }
}
