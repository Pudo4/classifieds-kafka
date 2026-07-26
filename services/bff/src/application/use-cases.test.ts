import { describe, expect, it } from 'vitest';
import { FakeListingClient } from './testing/fake-listing-client.js';
import { FakeMediaClient } from './testing/fake-media-client.js';
import { FakeEngagementClient } from './testing/fake-engagement-client.js';
import { getListingCard } from './use-cases/get-listing-card.usecase.js';
import { UpstreamServiceError } from './errors.js';
import type { ListingSummary } from '../domain/listing-card.js';

const OWNER = '11111111-1111-1111-1111-111111111111';
const LISTING_ID = '22222222-2222-2222-2222-222222222222';

function seedListing(client: FakeListingClient, overrides: Partial<ListingSummary> = {}): void {
  client.seed({
    id: LISTING_ID,
    ownerId: OWNER,
    title: 'Guitar',
    description: 'Acoustic',
    priceCents: 30000,
    category: 'music',
    status: 'active',
    rejectionReason: null,
    version: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
}

describe('getListingCard', () => {
  it('composes listing, media, and counters from three independent sources', async () => {
    const listingClient = new FakeListingClient();
    const mediaClient = new FakeMediaClient();
    const engagementClient = new FakeEngagementClient();

    seedListing(listingClient);
    mediaClient.seed(LISTING_ID, [{ id: 'media-1', status: 'ready', previewKey: 'preview.webp' }]);
    engagementClient.seedViewCount(LISTING_ID, 42);
    await engagementClient.addFavorite('some-user', LISTING_ID);
    await engagementClient.addFavorite('another-user', LISTING_ID);

    const card = await getListingCard(OWNER, LISTING_ID, listingClient, mediaClient, engagementClient);

    expect(card.listing.title).toBe('Guitar');
    expect(card.media).toEqual([{ id: 'media-1', status: 'ready', previewKey: 'preview.webp' }]);
    expect(card.counters).toEqual({ viewCount: 42, favoriteCount: 2 });
  });

  it('returns an empty media list and zero counters when nothing is there yet', async () => {
    const listingClient = new FakeListingClient();
    const mediaClient = new FakeMediaClient();
    const engagementClient = new FakeEngagementClient();
    seedListing(listingClient);

    const card = await getListingCard(OWNER, LISTING_ID, listingClient, mediaClient, engagementClient);

    expect(card.media).toEqual([]);
    expect(card.counters).toEqual({ viewCount: 0, favoriteCount: 0 });
  });

  it('propagates the upstream error when the listing itself is not found', async () => {
    const listingClient = new FakeListingClient();
    const mediaClient = new FakeMediaClient();
    const engagementClient = new FakeEngagementClient();

    await expect(getListingCard(OWNER, 'does-not-exist', listingClient, mediaClient, engagementClient)).rejects.toBeInstanceOf(
      UpstreamServiceError,
    );
  });
});
