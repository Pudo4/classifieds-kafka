import type { MediaAsset } from '../../domain/media-asset.js';
import type { MediaRepositoryPort } from '../ports/media-repository.port.js';

/** Only `ready` assets are meant to be displayed -- a `failed` or still-`uploaded` one has no usable preview. */
export async function listReadyMedia(listingId: string, repo: MediaRepositoryPort): Promise<MediaAsset[]> {
  const assets = await repo.findByListing(listingId);
  return assets.filter((asset) => asset.status === 'ready');
}
