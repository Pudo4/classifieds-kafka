import type { MediaAsset } from '../../domain/media-asset.js';

export interface MediaResponse {
  id: string;
  listingId: string;
  status: string;
  previewKey: string | null;
  failureReason: string | null;
}

export function toMediaResponse(asset: MediaAsset): MediaResponse {
  const snapshot = asset.toSnapshot();
  return {
    id: snapshot.id,
    listingId: snapshot.listingId,
    status: snapshot.status,
    previewKey: snapshot.previewKey,
    failureReason: snapshot.failureReason,
  };
}
