import { UpstreamServiceError } from '../../application/errors.js';
import type { MediaSummary } from '../../domain/listing-card.js';
import type { MediaClientPort, MediaUploadInput } from '../../application/ports/media-client.port.js';
import { httpRequestJson } from './http-request.js';

export class MediaHttpClient implements MediaClientPort {
  constructor(private readonly baseUrl: string) {}

  async upload(userId: string, listingId: string, file: MediaUploadInput): Promise<MediaSummary> {
    const form = new FormData();
    form.append('listingId', listingId);
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.contentType }), file.filename);

    const response = await fetch(new URL('/media', this.baseUrl), {
      method: 'POST',
      headers: { 'X-User-Id': userId },
      body: form,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new UpstreamServiceError(response.status, text || `media upload failed with status ${response.status}`);
    }
    return response.json();
  }

  listByListing(listingId: string): Promise<MediaSummary[]> {
    return httpRequestJson(this.baseUrl, `/media/by-listing/${listingId}`);
  }

  /**
   * Not part of `MediaClientPort` -- returns the raw upstream Fetch
   * `Response` so the controller can forward the image bytes and content
   * type as-is. Same plumbing-only reasoning as `NotificationHttpClient.openStream`.
   */
  async getFile(id: string): Promise<Response> {
    const response = await fetch(new URL(`/media/${id}/file`, this.baseUrl));
    if (!response.ok) {
      throw new UpstreamServiceError(response.status, `failed to fetch media file "${id}": ${response.status}`);
    }
    return response;
  }
}
