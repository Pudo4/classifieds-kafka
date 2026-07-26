import type { ListingSummary } from '../../domain/listing-card.js';

export interface CreateListingBody {
  title: string;
  description: string;
  priceCents: number;
  category: string;
}

export type UpdateListingBody = Partial<CreateListingBody>;

/** Everything BFF needs from `listing` -- a thin wrapper over its HTTP API, no business rules of its own. */
export interface ListingClientPort {
  create(userId: string, body: CreateListingBody): Promise<ListingSummary>;
  update(userId: string, listingId: string, body: UpdateListingBody): Promise<ListingSummary>;
  submit(userId: string, listingId: string): Promise<ListingSummary>;
  archive(userId: string, listingId: string): Promise<ListingSummary>;
  getOne(userId: string, listingId: string): Promise<ListingSummary>;
  listMine(userId: string): Promise<ListingSummary[]>;
}
