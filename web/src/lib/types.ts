export type ListingStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'archived';

export interface ListingSummary {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  status: ListingStatus;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaSummary {
  id: string;
  status: string;
  previewKey: string | null;
}

export interface ListingCard {
  listing: ListingSummary;
  media: MediaSummary[];
  counters: {
    viewCount: number;
    favoriteCount: number;
  };
}

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  priceCents: number;
  category: string;
  status: string;
  version: number;
}

export interface FavoriteSummary {
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface NotificationSummary {
  id: string;
  category: string;
  message: string;
  createdAt: string;
}
