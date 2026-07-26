import { describe, expect, it } from 'vitest';
import { InMemoryMediaRepository } from './testing/in-memory-media-repository.js';
import { InMemoryObjectStorage } from './testing/in-memory-object-storage.js';
import { FakeImageProcessor } from './testing/fake-image-processor.js';
import { uploadMedia } from './use-cases/upload-media.usecase.js';
import { processMedia } from './use-cases/process-media.usecase.js';
import { listReadyMedia } from './use-cases/list-ready-media.usecase.js';

const LISTING_ID = '11111111-1111-1111-1111-111111111111';
const OWNER_ID = '22222222-2222-2222-2222-222222222222';

function setup() {
  return { repo: new InMemoryMediaRepository(), storage: new InMemoryObjectStorage(), processor: new FakeImageProcessor() };
}

describe('uploadMedia', () => {
  it('stores the original bytes and records an "uploaded" asset', async () => {
    const { repo, storage } = setup();
    const asset = await uploadMedia(
      { listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('fake-jpeg-bytes'), contentType: 'image/jpeg' },
      repo,
      storage,
    );
    expect(asset.status).toBe('uploaded');
    expect(await storage.getObject(asset.originalKey)).toEqual(Buffer.from('fake-jpeg-bytes'));
    expect(repo.publishedEvents).toMatchObject([{ type: 'uploaded' }]);
  });
});

describe('processMedia', () => {
  it('a clean image is processed and marked ready', async () => {
    const { repo, storage, processor } = setup();
    const asset = await uploadMedia(
      { listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('good-image'), contentType: 'image/jpeg' },
      repo,
      storage,
    );

    const outcome = await processMedia({ mediaId: asset.id, stage: 'initial' }, repo, storage, processor);

    expect(outcome.outcome).toBe('processed');
    expect((await repo.findById(asset.id))?.status).toBe('ready');
  });

  it('a corrupt image is a permanent failure and goes straight to dlq, no retry', async () => {
    const { repo, storage, processor } = setup();
    processor.rejectAsCorrupt = true;
    const asset = await uploadMedia(
      { listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('garbage'), contentType: 'image/jpeg' },
      repo,
      storage,
    );

    const outcome = await processMedia({ mediaId: asset.id, stage: 'initial' }, repo, storage, processor);

    expect(outcome).toMatchObject({ outcome: 'dlq', reason: 'not a valid image' });
    expect((await repo.findById(asset.id))?.status).toBe('failed');
  });

  it('a transient storage failure on the initial attempt schedules a 10s retry, asset stays uploaded', async () => {
    const { repo, storage, processor } = setup();
    const asset = await uploadMedia(
      { listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('good-image'), contentType: 'image/jpeg' },
      repo,
      storage,
    );
    storage.failNextCalls = 1; // fails the getObject() inside processMedia

    const outcome = await processMedia({ mediaId: asset.id, stage: 'initial' }, repo, storage, processor);

    expect(outcome).toMatchObject({ outcome: 'retry', stage: 'retry-10s', delayMs: 10_000 });
    expect((await repo.findById(asset.id))?.status).toBe('uploaded');
  });

  it('walks the full ladder: initial fail -> 10s retry fails -> 1m retry succeeds', async () => {
    const { repo, storage, processor } = setup();
    const asset = await uploadMedia(
      { listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('good-image'), contentType: 'image/jpeg' },
      repo,
      storage,
    );

    storage.failNextCalls = 1;
    const first = await processMedia({ mediaId: asset.id, stage: 'initial' }, repo, storage, processor);
    expect(first).toMatchObject({ outcome: 'retry', stage: 'retry-10s' });

    storage.failNextCalls = 1;
    const second = await processMedia({ mediaId: asset.id, stage: 'retry-10s' }, repo, storage, processor);
    expect(second).toMatchObject({ outcome: 'retry', stage: 'retry-1m' });

    const third = await processMedia({ mediaId: asset.id, stage: 'retry-1m' }, repo, storage, processor);
    expect(third.outcome).toBe('processed');
    expect((await repo.findById(asset.id))?.status).toBe('ready');
  });

  it('a transient failure that persists through the 1m retry finally goes to dlq', async () => {
    const { repo, storage, processor } = setup();
    const asset = await uploadMedia(
      { listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('good-image'), contentType: 'image/jpeg' },
      repo,
      storage,
    );

    storage.failNextCalls = 1;
    await processMedia({ mediaId: asset.id, stage: 'initial' }, repo, storage, processor);
    storage.failNextCalls = 1;
    await processMedia({ mediaId: asset.id, stage: 'retry-10s' }, repo, storage, processor);
    storage.failNextCalls = 1;
    const final = await processMedia({ mediaId: asset.id, stage: 'retry-1m' }, repo, storage, processor);

    expect(final.outcome).toBe('dlq');
    expect((await repo.findById(asset.id))?.status).toBe('failed');
  });

  it('a message for an already-ready asset is skipped (duplicate/late retry message)', async () => {
    const { repo, storage, processor } = setup();
    const asset = await uploadMedia(
      { listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('good-image'), contentType: 'image/jpeg' },
      repo,
      storage,
    );
    await processMedia({ mediaId: asset.id, stage: 'initial' }, repo, storage, processor);

    const outcome = await processMedia({ mediaId: asset.id, stage: 'retry-10s' }, repo, storage, processor);
    expect(outcome).toEqual({ outcome: 'skip' });
  });

  it('a message for a non-existent asset is skipped, not thrown', async () => {
    const { repo, storage, processor } = setup();
    const outcome = await processMedia({ mediaId: 'does-not-exist', stage: 'initial' }, repo, storage, processor);
    expect(outcome).toEqual({ outcome: 'skip' });
  });
});

describe('listReadyMedia', () => {
  it('returns only ready assets for the listing, not uploaded/failed ones or other listings’', async () => {
    const { repo, storage, processor } = setup();
    const ready = await uploadMedia({ listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('good'), contentType: 'image/jpeg' }, repo, storage);
    await processMedia({ mediaId: ready.id, stage: 'initial' }, repo, storage, processor);

    processor.rejectAsCorrupt = true;
    const failed = await uploadMedia({ listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('bad'), contentType: 'image/jpeg' }, repo, storage);
    await processMedia({ mediaId: failed.id, stage: 'initial' }, repo, storage, processor);

    await uploadMedia({ listingId: LISTING_ID, ownerId: OWNER_ID, data: Buffer.from('untouched'), contentType: 'image/jpeg' }, repo, storage); // stays 'uploaded'
    await uploadMedia({ listingId: 'other-listing', ownerId: OWNER_ID, data: Buffer.from('elsewhere'), contentType: 'image/jpeg' }, repo, storage);

    const result = await listReadyMedia(LISTING_ID, repo);
    expect(result.map((a) => a.id)).toEqual([ready.id]);
  });
});
