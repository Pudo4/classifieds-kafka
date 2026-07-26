import type { SearchClientPort, SearchQuery, SearchResultItem } from '../../application/ports/search-client.port.js';
import { httpRequestJson } from './http-request.js';

export class SearchHttpClient implements SearchClientPort {
  constructor(private readonly baseUrl: string) {}

  search(query: SearchQuery): Promise<SearchResultItem[]> {
    return httpRequestJson(this.baseUrl, '/search', {
      query: { q: query.text, category: query.category, minPriceCents: query.minPriceCents, maxPriceCents: query.maxPriceCents },
    });
  }
}
