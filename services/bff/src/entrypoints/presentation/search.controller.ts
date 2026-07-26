import { Controller, Get, Query } from '@nestjs/common';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { SearchHttpClient } from '../../infrastructure/http/search-http-client.js';
import type { SearchResultItem } from '../../application/ports/search-client.port.js';

interface SearchQueryParams {
  q?: string;
  category?: string;
  minPriceCents?: string;
  maxPriceCents?: string;
}

@Controller('search')
export class SearchController {
  constructor(private readonly searchClient: SearchHttpClient) {}

  @Get()
  search(@Query() query: SearchQueryParams): Promise<SearchResultItem[]> {
    return this.searchClient.search({
      text: query.q,
      category: query.category,
      minPriceCents: query.minPriceCents !== undefined ? Number(query.minPriceCents) : undefined,
      maxPriceCents: query.maxPriceCents !== undefined ? Number(query.maxPriceCents) : undefined,
    });
  }
}
