import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId, ZodValidationPipe } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI --
// `import type` would erase it and break resolution at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ListingService } from '../listing.service.js';
import {
  createListingBodySchema,
  toDetailsPatch,
  updateListingBodySchema,
  type CreateListingBody,
  type UpdateListingBody,
} from './dto/listing.dto.js';
import { toListingResponse, type ListingResponse } from './listing.response.js';

@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createListingBodySchema)) body: CreateListingBody,
    @CurrentUserId() userId: string,
  ): Promise<ListingResponse> {
    const listing = await this.listingService.createListing({ ownerId: userId, ...body });
    return toListingResponse(listing);
  }

  @Get('mine')
  async mine(@CurrentUserId() userId: string): Promise<ListingResponse[]> {
    const listings = await this.listingService.listMyListings(userId);
    return listings.map(toListingResponse);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUserId() userId: string): Promise<ListingResponse> {
    const listing = await this.listingService.getListing(id, userId);
    return toListingResponse(listing);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateListingBodySchema)) body: UpdateListingBody,
    @CurrentUserId() userId: string,
  ): Promise<ListingResponse> {
    const listing = await this.listingService.updateListing(id, userId, toDetailsPatch(body));
    return toListingResponse(listing);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @CurrentUserId() userId: string): Promise<ListingResponse> {
    const listing = await this.listingService.submitListing(id, userId);
    return toListingResponse(listing);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @CurrentUserId() userId: string): Promise<ListingResponse> {
    const listing = await this.listingService.archiveListing(id, userId);
    return toListingResponse(listing);
  }
}
