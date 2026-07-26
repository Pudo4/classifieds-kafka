import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { EngagementHttpClient } from '../../infrastructure/http/engagement-http-client.js';
import type { ResponseSummary } from '../../application/ports/engagement-client.port.js';

@Controller('responses')
export class ResponsesController {
  constructor(private readonly engagementClient: EngagementHttpClient) {}

  @Post()
  create(
    @Body('listingId') listingId: string,
    @Body('message') message: string,
    @CurrentUserId() userId: string,
  ): Promise<ResponseSummary> {
    return this.engagementClient.createResponse(userId, listingId, message);
  }

  @Get(':listingId')
  listForListing(@Param('listingId') listingId: string): Promise<ResponseSummary[]> {
    return this.engagementClient.listResponses(listingId);
  }
}
