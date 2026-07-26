import { MeilisearchApiError, type Meilisearch } from 'meilisearch';
import type { ListingStatus } from '@classifieds/contracts';
import type { SearchListingDocument } from '../../domain/search-listing-document.js';
import type { SearchIndexPort, SearchQuery } from '../../application/ports/search-index.port.js';

function escapeFilterValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

function buildFilter(query: SearchQuery & { status: ListingStatus }): string[] {
  const filters = [`status = "${escapeFilterValue(query.status)}"`];
  if (query.category !== undefined) filters.push(`category = "${escapeFilterValue(query.category)}"`);
  if (query.minPriceCents !== undefined) filters.push(`priceCents >= ${query.minPriceCents}`);
  if (query.maxPriceCents !== undefined) filters.push(`priceCents <= ${query.maxPriceCents}`);
  return filters;
}

export class MeilisearchIndex implements SearchIndexPort {
  constructor(
    private readonly client: Meilisearch,
    private readonly indexName: string,
  ) {}

  async upsert(document: SearchListingDocument): Promise<void> {
    await this.client.index(this.indexName).addDocuments([document]);
  }

  async remove(id: string): Promise<void> {
    await this.client.index<SearchListingDocument>(this.indexName).deleteDocument(id);
  }

  async getVersion(id: string): Promise<number | null> {
    try {
      const document = await this.client.index<SearchListingDocument>(this.indexName).getDocument(id);
      return document.version;
    } catch (error) {
      if (error instanceof MeilisearchApiError && error.response.status === 404) return null;
      throw error;
    }
  }

  async search(query: SearchQuery & { status: 'active' }): Promise<SearchListingDocument[]> {
    const result = await this.client.index<SearchListingDocument>(this.indexName).search(query.text ?? '', {
      filter: buildFilter(query),
    });
    return result.hits;
  }
}
