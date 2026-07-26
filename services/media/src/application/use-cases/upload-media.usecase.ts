import { randomUUID } from 'node:crypto';
import { MediaAsset } from '../../domain/media-asset.js';
import type { MediaRepositoryPort } from '../ports/media-repository.port.js';
import type { ObjectStoragePort } from '../ports/object-storage.port.js';

export interface UploadMediaInput {
  listingId: string;
  ownerId: string;
  data: Buffer;
  contentType: string;
}

function buildOriginalKey(listingId: string, mediaId: string, contentType: string): string {
  const extension = contentType.split('/')[1] ?? 'bin';
  return `listings/${listingId}/${mediaId}/original.${extension}`;
}

export async function uploadMedia(
  input: UploadMediaInput,
  repo: MediaRepositoryPort,
  storage: ObjectStoragePort,
): Promise<MediaAsset> {
  const id = randomUUID();
  const originalKey = buildOriginalKey(input.listingId, id, input.contentType);

  // Written before the DB row so a crash between the two never leaves a
  // "ready" asset pointing at bytes that don't exist -- worst case here is
  // an orphaned object in MinIO with no asset record, which is harmless.
  await storage.putObject(originalKey, input.data, input.contentType);

  const asset = MediaAsset.create({ id, listingId: input.listingId, ownerId: input.ownerId, originalKey });
  await repo.save(asset);
  return asset;
}
