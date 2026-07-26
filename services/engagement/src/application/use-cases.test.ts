import { describe, expect, it } from 'vitest';
import { InMemoryFavoriteRepository } from './testing/in-memory-favorite-repository.js';
import { InMemoryResponseRepository } from './testing/in-memory-response-repository.js';
import { InMemoryViewBuffer } from './testing/in-memory-view-buffer.js';
import { InMemoryViewRepository } from './testing/in-memory-view-repository.js';
import { addFavorite } from './use-cases/add-favorite.usecase.js';
import { removeFavorite } from './use-cases/remove-favorite.usecase.js';
import { listMyFavorites } from './use-cases/list-my-favorites.usecase.js';
import { createResponse } from './use-cases/create-response.usecase.js';
import { listResponses } from './use-cases/list-responses.usecase.js';
import { recordView } from './use-cases/record-view.usecase.js';
import { flushViewBatches } from './use-cases/flush-view-batches.usecase.js';
import { countFavorites } from './use-cases/count-favorites.usecase.js';
import { InvalidResponseMessageError } from './errors.js';

const USER = '11111111-1111-1111-1111-111111111111';
const OTHER_USER = '99999999-9999-9999-9999-999999999999';
const LISTING = '22222222-2222-2222-2222-222222222222';

describe('addFavorite / removeFavorite', () => {
  it('creates a favorite and records a "favorited" event', async () => {
    const repo = new InMemoryFavoriteRepository();
    const favorite = await addFavorite({ userId: USER, listingId: LISTING }, repo);
    expect(favorite).toMatchObject({ userId: USER, listingId: LISTING });
    expect(repo.publishedEvents).toMatchObject([{ type: 'favorited' }]);
  });

  it('favoriting twice is idempotent -- no duplicate row, no second event', async () => {
    const repo = new InMemoryFavoriteRepository();
    await addFavorite({ userId: USER, listingId: LISTING }, repo);
    await addFavorite({ userId: USER, listingId: LISTING }, repo);
    expect(await repo.listByUser(USER)).toHaveLength(1);
    expect(repo.publishedEvents).toHaveLength(1);
  });

  it('removing an existing favorite records an "unfavorited" event', async () => {
    const repo = new InMemoryFavoriteRepository();
    await addFavorite({ userId: USER, listingId: LISTING }, repo);
    await removeFavorite(USER, LISTING, repo);
    expect(await repo.findOne(USER, LISTING)).toBeNull();
    expect(repo.publishedEvents.map((e) => e.type)).toEqual(['favorited', 'unfavorited']);
  });

  it('removing a favorite that was never added is a harmless no-op', async () => {
    const repo = new InMemoryFavoriteRepository();
    await expect(removeFavorite(USER, LISTING, repo)).resolves.toBeUndefined();
    expect(repo.publishedEvents).toHaveLength(0);
  });

  it('listMyFavorites only returns the requesting user’s favorites', async () => {
    const repo = new InMemoryFavoriteRepository();
    await addFavorite({ userId: USER, listingId: LISTING }, repo);
    await addFavorite({ userId: OTHER_USER, listingId: LISTING }, repo);
    const mine = await listMyFavorites(USER, repo);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.userId).toBe(USER);
  });

  it('countFavorites counts across users for one listing', async () => {
    const repo = new InMemoryFavoriteRepository();
    await addFavorite({ userId: USER, listingId: LISTING }, repo);
    await addFavorite({ userId: OTHER_USER, listingId: LISTING }, repo);
    expect(await countFavorites(LISTING, repo)).toBe(2);
    await removeFavorite(USER, LISTING, repo);
    expect(await countFavorites(LISTING, repo)).toBe(1);
  });
});

describe('createResponse / listResponses', () => {
  it('creates a response for a listing', async () => {
    const repo = new InMemoryResponseRepository();
    const response = await createResponse({ listingId: LISTING, userId: USER, message: 'Still available?' }, repo);
    expect(response.message).toBe('Still available?');
    expect(await listResponses(LISTING, repo)).toEqual([response]);
  });

  it('rejects an empty message before touching the repository', async () => {
    const repo = new InMemoryResponseRepository();
    await expect(createResponse({ listingId: LISTING, userId: USER, message: '' }, repo)).rejects.toBeInstanceOf(
      InvalidResponseMessageError,
    );
    expect(await listResponses(LISTING, repo)).toHaveLength(0);
  });
});

describe('recordView / flushViewBatches', () => {
  it('rapid views accumulate in the buffer without touching the view repository', async () => {
    const buffer = new InMemoryViewBuffer();
    const repo = new InMemoryViewRepository();
    await recordView(LISTING, buffer);
    await recordView(LISTING, buffer);
    await recordView(LISTING, buffer);
    expect(await repo.getViewCount(LISTING)).toBe(0); // nothing applied yet -- still just buffered
  });

  it('a flush applies the whole buffered count as one batch, not one write per view', async () => {
    const buffer = new InMemoryViewBuffer();
    const repo = new InMemoryViewRepository();
    await recordView(LISTING, buffer);
    await recordView(LISTING, buffer);
    await recordView(LISTING, buffer);

    const flushedCount = await flushViewBatches(buffer, repo);

    expect(flushedCount).toBe(1); // one listing, one batch, regardless of view count
    expect(repo.appliedBatches).toEqual([{ listingId: LISTING, incrementBy: 3 }]);
    expect(await repo.getViewCount(LISTING)).toBe(3);
  });

  it('an empty buffer flushes to nothing', async () => {
    const buffer = new InMemoryViewBuffer();
    const repo = new InMemoryViewRepository();
    expect(await flushViewBatches(buffer, repo)).toBe(0);
    expect(repo.appliedBatches).toHaveLength(0);
  });

  it('views for multiple listings batch independently', async () => {
    const buffer = new InMemoryViewBuffer();
    const repo = new InMemoryViewRepository();
    const otherListing = '33333333-3333-3333-3333-333333333333';
    await recordView(LISTING, buffer);
    await recordView(otherListing, buffer);
    await recordView(otherListing, buffer);

    await flushViewBatches(buffer, repo);

    expect(await repo.getViewCount(LISTING)).toBe(1);
    expect(await repo.getViewCount(otherListing)).toBe(2);
  });
});
