import { describe, expect, it } from 'vitest';
import { MediaAsset } from './media-asset.js';
import { MediaNotPendingError } from './media-errors.js';

function createAsset(): MediaAsset {
  return MediaAsset.create({
    id: 'media-1',
    listingId: 'listing-1',
    ownerId: 'owner-1',
    originalKey: 'listings/listing-1/media-1/original.jpg',
  });
}

describe('MediaAsset.create', () => {
  it('starts uploaded and raises an "uploaded" event', () => {
    const asset = createAsset();
    expect(asset.status).toBe('uploaded');
    const events = asset.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'uploaded' });
  });
});

describe('markReady', () => {
  it('moves uploaded -> ready and records the preview key', () => {
    const asset = createAsset();
    asset.pullDomainEvents();
    asset.markReady('listings/listing-1/media-1/preview.webp');
    expect(asset.status).toBe('ready');
    expect(asset.toSnapshot().previewKey).toBe('listings/listing-1/media-1/preview.webp');
    expect(asset.pullDomainEvents()).toMatchObject([{ type: 'processed' }]);
  });

  it('cannot be called twice', () => {
    const asset = createAsset();
    asset.markReady('preview.webp');
    expect(() => asset.markReady('preview-2.webp')).toThrow(MediaNotPendingError);
  });

  it('cannot be called on an already-failed asset', () => {
    const asset = createAsset();
    asset.markFailed('corrupt file');
    expect(() => asset.markReady('preview.webp')).toThrow(MediaNotPendingError);
  });
});

describe('markFailed', () => {
  it('moves uploaded -> failed and records the reason', () => {
    const asset = createAsset();
    asset.pullDomainEvents();
    asset.markFailed('not a valid image');
    expect(asset.status).toBe('failed');
    expect(asset.toSnapshot().failureReason).toBe('not a valid image');
    expect(asset.pullDomainEvents()).toMatchObject([{ type: 'failed', reason: 'not a valid image' }]);
  });

  it('cannot be called twice', () => {
    const asset = createAsset();
    asset.markFailed('bad data');
    expect(() => asset.markFailed('bad data again')).toThrow(MediaNotPendingError);
  });
});
