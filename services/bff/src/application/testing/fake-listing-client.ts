import { UpstreamServiceError } from '../errors.js';
import type { ListingSummary } from '../../domain/listing-card.js';
import type { CreateListingBody, ListingClientPort, UpdateListingBody } from '../ports/listing-client.port.js';

export class FakeListingClient implements ListingClientPort {
  private readonly store = new Map<string, ListingSummary>();

  seed(listing: ListingSummary): void {
    this.store.set(listing.id, listing);
  }

  async create(userId: string, body: CreateListingBody): Promise<ListingSummary> {
    const listing: ListingSummary = {
      id: `listing-${this.store.size + 1}`,
      ownerId: userId,
      status: 'draft',
      rejectionReason: null,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    this.store.set(listing.id, listing);
    return listing;
  }

  async update(_userId: string, listingId: string, body: UpdateListingBody): Promise<ListingSummary> {
    const existing = await this.getOne(_userId, listingId);
    const updated = { ...existing, ...body };
    this.store.set(listingId, updated);
    return updated;
  }

  async submit(_userId: string, listingId: string): Promise<ListingSummary> {
    const listing = await this.getOne(_userId, listingId);
    const updated = { ...listing, status: 'pending' };
    this.store.set(listingId, updated);
    return updated;
  }

  async archive(_userId: string, listingId: string): Promise<ListingSummary> {
    const listing = await this.getOne(_userId, listingId);
    const updated = { ...listing, status: 'archived' };
    this.store.set(listingId, updated);
    return updated;
  }

  async getOne(_userId: string, listingId: string): Promise<ListingSummary> {
    const listing = this.store.get(listingId);
    if (!listing) throw new UpstreamServiceError(404, `listing "${listingId}" not found`);
    return listing;
  }

  async listMine(userId: string): Promise<ListingSummary[]> {
    return [...this.store.values()].filter((listing) => listing.ownerId === userId);
  }
}
