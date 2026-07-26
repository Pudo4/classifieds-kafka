import type { Response } from '../../domain/response.js';
import type { ResponseRepositoryPort } from '../ports/response-repository.port.js';

export class InMemoryResponseRepository implements ResponseRepositoryPort {
  private readonly store: Response[] = [];

  async add(response: Response): Promise<void> {
    this.store.push(response);
  }

  async listByListing(listingId: string): Promise<Response[]> {
    return this.store.filter((r) => r.listingId === listingId);
  }
}
