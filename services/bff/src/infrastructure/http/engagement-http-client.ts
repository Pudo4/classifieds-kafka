import type {
  EngagementClientPort,
  FavoriteSummary,
  ResponseSummary,
} from '../../application/ports/engagement-client.port.js';
import { httpRequestJson, httpRequestVoid } from './http-request.js';

export class EngagementHttpClient implements EngagementClientPort {
  constructor(private readonly baseUrl: string) {}

  addFavorite(userId: string, listingId: string): Promise<FavoriteSummary> {
    return httpRequestJson(this.baseUrl, '/favorites', { method: 'POST', userId, body: { listingId } });
  }

  removeFavorite(userId: string, listingId: string): Promise<void> {
    return httpRequestVoid(this.baseUrl, `/favorites/${listingId}`, { method: 'DELETE', userId });
  }

  listMyFavorites(userId: string): Promise<FavoriteSummary[]> {
    return httpRequestJson(this.baseUrl, '/favorites/mine', { userId });
  }

  async getFavoriteCount(listingId: string): Promise<number> {
    const result = await httpRequestJson<{ favoriteCount: number }>(this.baseUrl, `/favorites/count/${listingId}`);
    return result.favoriteCount;
  }

  createResponse(userId: string, listingId: string, message: string): Promise<ResponseSummary> {
    return httpRequestJson(this.baseUrl, '/responses', { method: 'POST', userId, body: { listingId, message } });
  }

  listResponses(listingId: string): Promise<ResponseSummary[]> {
    return httpRequestJson(this.baseUrl, `/responses/${listingId}`);
  }

  recordView(userId: string, listingId: string): Promise<void> {
    return httpRequestVoid(this.baseUrl, `/views/${listingId}`, { method: 'POST', userId });
  }

  async getViewCount(listingId: string): Promise<number> {
    const result = await httpRequestJson<{ viewCount: number }>(this.baseUrl, `/views/${listingId}`);
    return result.viewCount;
  }
}
