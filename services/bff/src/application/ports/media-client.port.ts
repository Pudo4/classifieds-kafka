import type { MediaSummary } from '../../domain/listing-card.js';

export interface MediaUploadInput {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export interface MediaClientPort {
  upload(userId: string, listingId: string, file: MediaUploadInput): Promise<MediaSummary>;
  listByListing(listingId: string): Promise<MediaSummary[]>;
}
