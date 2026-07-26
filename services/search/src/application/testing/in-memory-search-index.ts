import type { SearchListingDocument } from '../../domain/search-listing-document.js';
import type { SearchIndexPort, SearchQuery } from '../ports/search-index.port.js';

export class InMemorySearchIndex implements SearchIndexPort {
  private readonly store = new Map<string, SearchListingDocument>();

  async upsert(document: SearchListingDocument): Promise<void> {
    this.store.set(document.id, document);
  }

  async remove(id: string): Promise<void> {
    this.store.delete(id);
  }

  async getVersion(id: string): Promise<number | null> {
    return this.store.get(id)?.version ?? null;
  }

  async search(query: SearchQuery & { status: 'active' }): Promise<SearchListingDocument[]> {
    return [...this.store.values()].filter((doc) => {
      if (doc.status !== query.status) return false;
      if (query.category !== undefined && doc.category !== query.category) return false;
      if (query.minPriceCents !== undefined && doc.priceCents < query.minPriceCents) return false;
      if (query.maxPriceCents !== undefined && doc.priceCents > query.maxPriceCents) return false;
      if (query.text !== undefined) {
        const haystack = `${doc.title} ${doc.description}`.toLowerCase();
        if (!haystack.includes(query.text.toLowerCase())) return false;
      }
      return true;
    });
  }
}
