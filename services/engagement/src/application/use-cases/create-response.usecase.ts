import { randomUUID } from 'node:crypto';
import { validateResponseMessage, type Response } from '../../domain/response.js';
import { InvalidResponseMessageError } from '../errors.js';
import type { ResponseRepositoryPort } from '../ports/response-repository.port.js';

export interface CreateResponseInput {
  listingId: string;
  userId: string;
  message: string;
}

export async function createResponse(input: CreateResponseInput, repo: ResponseRepositoryPort): Promise<Response> {
  const validationError = validateResponseMessage(input.message);
  if (validationError) throw new InvalidResponseMessageError(validationError);

  const response: Response = {
    id: randomUUID(),
    listingId: input.listingId,
    userId: input.userId,
    message: input.message,
    createdAt: new Date(),
  };
  await repo.add(response);
  return response;
}
