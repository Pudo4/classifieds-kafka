import type { Response } from '../../domain/response.js';
import type { ResponseRepositoryPort } from '../ports/response-repository.port.js';

export async function listResponses(listingId: string, repo: ResponseRepositoryPort): Promise<Response[]> {
  return repo.listByListing(listingId);
}
