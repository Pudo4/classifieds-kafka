import type { MediaAsset } from '../../domain/media-asset.js';

export const MEDIA_REPOSITORY = Symbol('MEDIA_REPOSITORY');

export interface MediaRepositoryPort {
  save(asset: MediaAsset): Promise<void>;
  findById(id: string): Promise<MediaAsset | null>;
  findByListing(listingId: string): Promise<MediaAsset[]>;
}
