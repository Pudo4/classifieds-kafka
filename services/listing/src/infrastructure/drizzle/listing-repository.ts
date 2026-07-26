import { eq } from 'drizzle-orm';
import { claimEvent } from '@classifieds/idempotency';
import { insertOutboxMessages } from '@classifieds/outbox';
import { Listing, type ListingProps } from '../../domain/listing.entity.js';
import type { ListingRepositoryPort } from '../../application/ports/listing-repository.port.js';
import type { Db } from './db.js';
import { listings, type ListingRow, type NewListingRow } from './schema.js';
import { mapListingDomainEventToOutboxMessages } from './listing-event.mapper.js';

const CONSUMER_GROUP = 'listing';

function toRow(props: ListingProps): NewListingRow {
  return {
    id: props.id,
    ownerId: props.ownerId,
    title: props.title,
    description: props.description,
    priceCents: props.priceCents,
    category: props.category,
    status: props.status,
    rejectionReason: props.rejectionReason,
    version: props.version,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}

function toProps(row: ListingRow): ListingProps {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    category: row.category,
    status: row.status,
    rejectionReason: row.rejectionReason,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleListingRepository implements ListingRepositoryPort {
  constructor(private readonly db: Db) {}

  async save(listing: Listing): Promise<void> {
    const events = listing.pullDomainEvents();
    const row = toRow(listing.toSnapshot());
    const outboxMessages = events.flatMap(mapListingDomainEventToOutboxMessages);

    await this.db.transaction(async (tx) => {
      await tx
        .insert(listings)
        .values(row)
        .onConflictDoUpdate({ target: listings.id, set: row });
      await insertOutboxMessages(tx, outboxMessages);
    });
  }

  async findById(id: string): Promise<Listing | null> {
    const [row] = await this.db.select().from(listings).where(eq(listings.id, id)).limit(1);
    return row ? Listing.fromPersistence(toProps(row)) : null;
  }

  async findByOwner(ownerId: string): Promise<Listing[]> {
    const rows = await this.db.select().from(listings).where(eq(listings.ownerId, ownerId));
    return rows.map((row) => Listing.fromPersistence(toProps(row)));
  }

  async applyEventIdempotently(
    listingId: string,
    sourceEventId: string,
    mutate: (listing: Listing) => void,
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const claimed = await claimEvent(tx, CONSUMER_GROUP, sourceEventId);
      if (!claimed) return false;

      const [row] = await tx.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!row) return false;

      const listing = Listing.fromPersistence(toProps(row));
      mutate(listing); // throws here roll back the claim above too -- same transaction

      const events = listing.pullDomainEvents();
      const updatedRow = toRow(listing.toSnapshot());
      await tx.update(listings).set(updatedRow).where(eq(listings.id, listingId));
      await insertOutboxMessages(tx, events.flatMap(mapListingDomainEventToOutboxMessages));
      return true;
    });
  }
}
