import type { SearchListingDocument } from '../../domain/search-listing-document.js';

export const SEARCH_INDEX = Symbol('SEARCH_INDEX');

export interface SearchQuery {
  // Explicit `| undefined` (not just `?:`) because the HTTP DTO's zod
  // `.optional()` fields are typed that way, and this project's
  // `exactOptionalPropertyTypes` distinguishes "key omitted" from "key
  // present with value undefined" -- unlike a domain patch that gets
  // spread over existing state, a query is consumed immediately, so
  // allowing the latter here costs nothing.
  text?: string | undefined;
  category?: string | undefined;
  minPriceCents?: number | undefined;
  maxPriceCents?: number | undefined;
}

/** Use-cases below never mention Meilisearch -- only this port. */
export interface SearchIndexPort {
  upsert(document: SearchListingDocument): Promise<void>;
  remove(id: string): Promise<void>;
  /** `null` means nothing is indexed for this id. */
  getVersion(id: string): Promise<number | null>;
  /** Always implicitly scoped to `status: 'active'` by the use-case that calls this -- see search-listings.usecase.ts. */
  search(query: SearchQuery & { status: 'active' }): Promise<SearchListingDocument[]>;
}
