import type { Response } from '../../domain/response.js';

export const RESPONSE_REPOSITORY = Symbol('RESPONSE_REPOSITORY');

export interface ResponseRepositoryPort {
  /** Creates the row and its outbox event atomically. */
  add(response: Response): Promise<void>;
  listByListing(listingId: string): Promise<Response[]>;
}
