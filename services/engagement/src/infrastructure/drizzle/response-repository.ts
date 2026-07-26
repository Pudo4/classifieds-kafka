import { eq } from 'drizzle-orm';
import { insertOutboxMessages } from '@classifieds/outbox';
import type { Response } from '../../domain/response.js';
import type { ResponseRepositoryPort } from '../../application/ports/response-repository.port.js';
import type { Db } from './db.js';
import { responses, type ResponseRow } from './schema.js';
import { mapResponseToOutboxMessage } from './engagement-event.mapper.js';

function toResponse(row: ResponseRow): Response {
  return { id: row.id, listingId: row.listingId, userId: row.userId, message: row.message, createdAt: row.createdAt };
}

export class DrizzleResponseRepository implements ResponseRepositoryPort {
  constructor(private readonly db: Db) {}

  async add(response: Response): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(responses).values(response);
      await insertOutboxMessages(tx, [mapResponseToOutboxMessage(response)]);
    });
  }

  async listByListing(listingId: string): Promise<Response[]> {
    const rows = await this.db.select().from(responses).where(eq(responses.listingId, listingId));
    return rows.map(toResponse);
  }
}
