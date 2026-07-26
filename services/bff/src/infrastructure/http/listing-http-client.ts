import type { ListingSummary } from '../../domain/listing-card.js';
import type { CreateListingBody, ListingClientPort, UpdateListingBody } from '../../application/ports/listing-client.port.js';
import { httpRequestJson } from './http-request.js';

export class ListingHttpClient implements ListingClientPort {
  constructor(private readonly baseUrl: string) {}

  create(userId: string, body: CreateListingBody): Promise<ListingSummary> {
    return httpRequestJson(this.baseUrl, '/listings', { method: 'POST', userId, body });
  }

  update(userId: string, listingId: string, body: UpdateListingBody): Promise<ListingSummary> {
    return httpRequestJson(this.baseUrl, `/listings/${listingId}`, { method: 'PATCH', userId, body });
  }

  submit(userId: string, listingId: string): Promise<ListingSummary> {
    return httpRequestJson(this.baseUrl, `/listings/${listingId}/submit`, { method: 'POST', userId });
  }

  archive(userId: string, listingId: string): Promise<ListingSummary> {
    return httpRequestJson(this.baseUrl, `/listings/${listingId}/archive`, { method: 'POST', userId });
  }

  getOne(userId: string, listingId: string): Promise<ListingSummary> {
    return httpRequestJson(this.baseUrl, `/listings/${listingId}`, { userId });
  }

  listMine(userId: string): Promise<ListingSummary[]> {
    return httpRequestJson(this.baseUrl, '/listings/mine', { userId });
  }
}
