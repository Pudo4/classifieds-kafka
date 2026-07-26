import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUserId, ZodValidationPipe } from '@classifieds/platform';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- see listing.controller.ts for why
import { EngagementService } from '../engagement.service.js';
import { createResponseBodySchema, type CreateResponseBody } from './dto/response.dto.js';

@Controller('responses')
export class ResponsesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createResponseBodySchema)) body: CreateResponseBody,
    @CurrentUserId() userId: string,
  ) {
    const response = await this.engagementService.createResponse({ listingId: body.listingId, userId, message: body.message });
    return {
      id: response.id,
      listingId: response.listingId,
      userId: response.userId,
      message: response.message,
      createdAt: response.createdAt.toISOString(),
    };
  }

  @Get(':listingId')
  async listForListing(@Param('listingId') listingId: string) {
    const responses = await this.engagementService.listResponses(listingId);
    return responses.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      userId: r.userId,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
