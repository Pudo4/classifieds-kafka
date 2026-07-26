export interface SearchQuery {
  text?: string | undefined;
  category?: string | undefined;
  minPriceCents?: number | undefined;
  maxPriceCents?: number | undefined;
}

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  priceCents: number;
  category: string;
  status: string;
  version: number;
}

export interface SearchClientPort {
  search(query: SearchQuery): Promise<SearchResultItem[]>;
}
