import { Listing, type ListingDomainEvent, type ListingProps } from '../../domain/listing.entity.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';

/**
 * Stands in for the Drizzle repository in use-case tests. Records every
 * pulled domain event the way the real repository's outbox write would, so
 * a test can assert "submitting a listing raised a submitted event"
 * without touching Postgres or Kafka.
 */
export class InMemoryListingRepository implements ListingRepositoryPort {
  private readonly store = new Map<string, ListingProps>();
  private readonly claimedEventIds = new Set<string>();
  readonly publishedEvents: ListingDomainEvent[] = [];

  async save(listing: Listing): Promise<void> {
    this.publishedEvents.push(...listing.pullDomainEvents());
    this.store.set(listing.id, listing.toSnapshot());
  }

  async findById(id: string): Promise<Listing | null> {
    const props = this.store.get(id);
    return props ? Listing.fromPersistence(props) : null;
  }

  async findByOwner(ownerId: string): Promise<Listing[]> {
    return [...this.store.values()].filter((props) => props.ownerId === ownerId).map(Listing.fromPersistence);
  }

  async applyEventIdempotently(
    listingId: string,
    sourceEventId: string,
    mutate: (listing: Listing) => void,
  ): Promise<boolean> {
    if (this.claimedEventIds.has(sourceEventId)) return false;
    const props = this.store.get(listingId);
    if (!props) return false;

    const listing = Listing.fromPersistence(props);
    mutate(listing); // throws before the claim/save below on an invalid transition -- matches the real repository's rollback semantics
    this.claimedEventIds.add(sourceEventId);
    await this.save(listing);
    return true;
  }
}
