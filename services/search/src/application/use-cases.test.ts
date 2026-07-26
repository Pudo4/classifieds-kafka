import { describe, expect, it } from 'vitest';
import { InMemorySearchIndex } from './testing/in-memory-search-index.js';
import { applyListingSnapshot } from './use-cases/apply-listing-snapshot.usecase.js';
import { searchListings } from './use-cases/search-listings.usecase.js';
import type { SearchListingDocument } from '../domain/search-listing-document.js';

function doc(overrides: Partial<SearchListingDocument> = {}): SearchListingDocument {
  return {
    id: 'listing-1',
    ownerId: 'owner-1',
    title: 'Bike',
    description: 'Barely used, great condition',
    priceCents: 15000,
    category: 'sports',
    status: 'active',
    version: 1,
    ...overrides,
  };
}

describe('applyListingSnapshot', () => {
  it('indexes a fresh document', async () => {
    const index = new InMemorySearchIndex();
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 1, document: doc() }, index);
    expect(await index.getVersion('listing-1')).toBe(1);
  });

  it('drops the same event applied twice', async () => {
    const index = new InMemorySearchIndex();
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 1, document: doc({ title: 'A' }) }, index);
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 1, document: doc({ title: 'B' }) }, index);
    const [result] = await index.search({ status: 'active' });
    expect(result?.title).toBe('A');
  });

  it('drops an older version arriving after a newer one', async () => {
    const index = new InMemorySearchIndex();
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 3, document: doc({ version: 3, title: 'New' }) }, index);
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 1, document: doc({ version: 1, title: 'Old' }) }, index);
    const [result] = await index.search({ status: 'active' });
    expect(result?.title).toBe('New');
  });

  it('applies a newer version after an older one', async () => {
    const index = new InMemorySearchIndex();
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 1, document: doc({ version: 1, title: 'Old' }) }, index);
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 2, document: doc({ version: 2, title: 'New' }) }, index);
    const [result] = await index.search({ status: 'active' });
    expect(result?.title).toBe('New');
  });

  it('a tombstone removes the document unconditionally', async () => {
    const index = new InMemorySearchIndex();
    await applyListingSnapshot('listing-1', { kind: 'upsert', version: 5, document: doc({ version: 5 }) }, index);
    await applyListingSnapshot('listing-1', { kind: 'delete' }, index);
    expect(await index.getVersion('listing-1')).toBeNull();
  });

  it('deleting a never-indexed id is a harmless no-op', async () => {
    const index = new InMemorySearchIndex();
    await expect(applyListingSnapshot('never-seen', { kind: 'delete' }, index)).resolves.toBeUndefined();
  });
});

describe('searchListings', () => {
  it('only returns active listings, even if a non-active one matches the filters', async () => {
    const index = new InMemorySearchIndex();
    await index.upsert(doc({ id: 'a', status: 'active', category: 'sports' }));
    await index.upsert(doc({ id: 'b', status: 'draft', category: 'sports' }));
    const results = await searchListings({ category: 'sports' }, index);
    expect(results.map((r) => r.id)).toEqual(['a']);
  });

  it('filters by price range', async () => {
    const index = new InMemorySearchIndex();
    await index.upsert(doc({ id: 'cheap', priceCents: 100 }));
    await index.upsert(doc({ id: 'mid', priceCents: 500 }));
    await index.upsert(doc({ id: 'pricey', priceCents: 9000 }));
    const results = await searchListings({ minPriceCents: 200, maxPriceCents: 1000 }, index);
    expect(results.map((r) => r.id)).toEqual(['mid']);
  });

  it('filters by free text against title/description', async () => {
    const index = new InMemorySearchIndex();
    await index.upsert(doc({ id: 'a', title: 'Mountain bike' }));
    await index.upsert(doc({ id: 'b', title: 'Sofa' }));
    const results = await searchListings({ text: 'bike' }, index);
    expect(results.map((r) => r.id)).toEqual(['a']);
  });
});
