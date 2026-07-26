export interface FavoriteSummary {
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface ResponseSummary {
  id: string;
  listingId: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface EngagementClientPort {
  addFavorite(userId: string, listingId: string): Promise<FavoriteSummary>;
  removeFavorite(userId: string, listingId: string): Promise<void>;
  listMyFavorites(userId: string): Promise<FavoriteSummary[]>;
  getFavoriteCount(listingId: string): Promise<number>;
  createResponse(userId: string, listingId: string, message: string): Promise<ResponseSummary>;
  listResponses(listingId: string): Promise<ResponseSummary[]>;
  recordView(userId: string, listingId: string): Promise<void>;
  getViewCount(listingId: string): Promise<number>;
}
