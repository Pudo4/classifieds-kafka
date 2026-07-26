import type { MediaSummary } from '../../domain/listing-card.js';
import type { MediaClientPort, MediaUploadInput } from '../ports/media-client.port.js';

export class FakeMediaClient implements MediaClientPort {
  private readonly byListing = new Map<string, MediaSummary[]>();

  seed(listingId: string, media: MediaSummary[]): void {
    this.byListing.set(listingId, media);
  }

  async upload(_userId: string, listingId: string, file: MediaUploadInput): Promise<MediaSummary> {
    const asset: MediaSummary = { id: `media-${file.filename}-${Date.now()}`, status: 'uploaded', previewKey: null };
    this.byListing.set(listingId, [...(this.byListing.get(listingId) ?? []), asset]);
    return asset;
  }

  async listByListing(listingId: string): Promise<MediaSummary[]> {
    return this.byListing.get(listingId) ?? [];
  }
}
