import type { EngagementClientPort, FavoriteSummary, ResponseSummary } from '../ports/engagement-client.port.js';

export class FakeEngagementClient implements EngagementClientPort {
  private readonly favorites = new Set<string>();
  private readonly responses: ResponseSummary[] = [];
  private readonly viewCounts = new Map<string, number>();

  seedViewCount(listingId: string, count: number): void {
    this.viewCounts.set(listingId, count);
  }

  private key(userId: string, listingId: string): string {
    return `${userId}:${listingId}`;
  }

  async addFavorite(userId: string, listingId: string): Promise<FavoriteSummary> {
    this.favorites.add(this.key(userId, listingId));
    return { userId, listingId, createdAt: new Date().toISOString() };
  }

  async removeFavorite(userId: string, listingId: string): Promise<void> {
    this.favorites.delete(this.key(userId, listingId));
  }

  async listMyFavorites(userId: string): Promise<FavoriteSummary[]> {
    return [...this.favorites]
      .filter((k) => k.startsWith(`${userId}:`))
      .map((k) => ({ userId, listingId: k.slice(userId.length + 1), createdAt: new Date().toISOString() }));
  }

  async getFavoriteCount(listingId: string): Promise<number> {
    return [...this.favorites].filter((k) => k.endsWith(`:${listingId}`)).length;
  }

  async createResponse(userId: string, listingId: string, message: string): Promise<ResponseSummary> {
    const response: ResponseSummary = { id: `response-${this.responses.length + 1}`, listingId, userId, message, createdAt: new Date().toISOString() };
    this.responses.push(response);
    return response;
  }

  async listResponses(listingId: string): Promise<ResponseSummary[]> {
    return this.responses.filter((r) => r.listingId === listingId);
  }

  async recordView(): Promise<void> {
    // not needed by any current test; view counts are seeded directly via seedViewCount
  }

  async getViewCount(listingId: string): Promise<number> {
    return this.viewCounts.get(listingId) ?? 0;
  }
}
