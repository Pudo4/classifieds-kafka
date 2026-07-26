import { Inject, Injectable } from '@nestjs/common';
import { SEARCH_INDEX, type SearchIndexPort, type SearchQuery } from '../application/ports/search-index.port.js';
import { searchListings } from '../application/use-cases/search-listings.usecase.js';
import type { SearchListingDocument } from '../domain/search-listing-document.js';

@Injectable()
export class SearchService {
  constructor(@Inject(SEARCH_INDEX) private readonly index: SearchIndexPort) {}

  search(query: SearchQuery): Promise<SearchListingDocument[]> {
    return searchListings(query, this.index);
  }
}
