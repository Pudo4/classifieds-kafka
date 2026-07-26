import { MediaAsset, type MediaAssetProps, type MediaDomainEvent } from '../../domain/media-asset.js';
import type { MediaRepositoryPort } from '../ports/media-repository.port.js';

export class InMemoryMediaRepository implements MediaRepositoryPort {
  private readonly store = new Map<string, MediaAssetProps>();
  readonly publishedEvents: MediaDomainEvent[] = [];

  async save(asset: MediaAsset): Promise<void> {
    this.publishedEvents.push(...asset.pullDomainEvents());
    this.store.set(asset.id, asset.toSnapshot());
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const props = this.store.get(id);
    return props ? MediaAsset.fromPersistence(props) : null;
  }

  async findByListing(listingId: string): Promise<MediaAsset[]> {
    return [...this.store.values()].filter((props) => props.listingId === listingId).map(MediaAsset.fromPersistence);
  }
}
