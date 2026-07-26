import { Inject, Injectable } from '@nestjs/common';
import { MEDIA_REPOSITORY, type MediaRepositoryPort } from '../application/ports/media-repository.port.js';
import { OBJECT_STORAGE, type ObjectStoragePort } from '../application/ports/object-storage.port.js';
import { uploadMedia, type UploadMediaInput } from '../application/use-cases/upload-media.usecase.js';
import { listReadyMedia } from '../application/use-cases/list-ready-media.usecase.js';
import type { MediaAsset } from '../domain/media-asset.js';

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repo: MediaRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
  ) {}

  upload(input: UploadMediaInput): Promise<MediaAsset> {
    return uploadMedia(input, this.repo, this.storage);
  }

  findById(id: string): Promise<MediaAsset | null> {
    return this.repo.findById(id);
  }

  listReadyForListing(listingId: string): Promise<MediaAsset[]> {
    return listReadyMedia(listingId, this.repo);
  }

  async getPreviewFile(id: string): Promise<Buffer | null> {
    const asset = await this.repo.findById(id);
    const previewKey = asset?.toSnapshot().previewKey;
    if (!previewKey) return null;
    return this.storage.getObject(previewKey);
  }
}
