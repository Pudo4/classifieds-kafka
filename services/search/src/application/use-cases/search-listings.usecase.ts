import type { SearchListingDocument } from '../../domain/search-listing-document.js';
import type { SearchIndexPort, SearchQuery } from '../ports/search-index.port.js';

/** Non-active listings (draft/pending/rejected) are indexed but never searchable -- this is the one place that's enforced. */
export async function searchListings(query: SearchQuery, index: SearchIndexPort): Promise<SearchListingDocument[]> {
  return index.search({ ...query, status: 'active' });
}
