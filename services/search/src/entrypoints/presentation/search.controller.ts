import { Controller, Get, Query } from '@nestjs/common';
import { ZodValidationPipe } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI --
// `import type` would erase it and break resolution at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { SearchService } from '../search.service.js';
import { searchQuerySchema, type SearchQueryDto } from './dto/search-query.dto.js';
import type { SearchListingDocument } from '../../domain/search-listing-document.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQueryDto,
  ): Promise<SearchListingDocument[]> {
    return this.searchService.search({
      text: query.q,
      category: query.category,
      minPriceCents: query.minPriceCents,
      maxPriceCents: query.maxPriceCents,
    });
  }
}
