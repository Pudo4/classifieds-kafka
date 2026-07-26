import type { ListingCard } from '../../domain/listing-card.js';
import type { ListingClientPort } from '../ports/listing-client.port.js';
import type { MediaClientPort } from '../ports/media-client.port.js';
import type { EngagementClientPort } from '../ports/engagement-client.port.js';

/**
 * The one place in this service that actually composes -- everything else
 * in `bff` is a direct proxy. Three independent reads happen in parallel;
 * if the listing itself 404s/403s, that propagates and the whole card
 * request fails the same way (there's no "partial card" to show without
 * its main subject). Media and counters failing independently isn't
 * handled specially here either -- see README for why that's an accepted
 * simplification rather than a resilience feature to build.
 */
export async function getListingCard(
  userId: string,
  listingId: string,
  listingClient: ListingClientPort,
  mediaClient: MediaClientPort,
  engagementClient: EngagementClientPort,
): Promise<ListingCard> {
  const [listing, media, viewCount, favoriteCount] = await Promise.all([
    listingClient.getOne(userId, listingId),
    mediaClient.listByListing(listingId),
    engagementClient.getViewCount(listingId),
    engagementClient.getFavoriteCount(listingId),
  ]);

  return {
    listing,
    media,
    counters: { viewCount, favoriteCount },
  };
}
