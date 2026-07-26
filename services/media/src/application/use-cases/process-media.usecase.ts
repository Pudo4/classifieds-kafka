import type { MediaAsset } from '../../domain/media-asset.js';
import { PermanentMediaError, TransientMediaError } from '../../domain/media-errors.js';
import { decideNextAction, type RetryStage } from '../../domain/retry-policy.js';
import type { MediaRepositoryPort } from '../ports/media-repository.port.js';
import type { ObjectStoragePort } from '../ports/object-storage.port.js';
import type { ImageProcessorPort } from '../ports/image-processor.port.js';

export type ProcessOutcome =
  | { outcome: 'processed'; asset: MediaAsset }
  | { outcome: 'dlq'; asset: MediaAsset; reason: string }
  | { outcome: 'retry'; stage: 'retry-10s' | 'retry-1m'; delayMs: number; asset: MediaAsset }
  /** The asset is gone or already resolved (ready/failed) -- a late or duplicate message with nothing left to do. */
  | { outcome: 'skip' };

function buildPreviewKey(originalKey: string): string {
  return originalKey.replace(/\/original\.[^/]+$/, '/preview.webp');
}

export interface ProcessMediaInput {
  mediaId: string;
  stage: RetryStage;
}

export async function processMedia(
  input: ProcessMediaInput,
  repo: MediaRepositoryPort,
  storage: ObjectStoragePort,
  processor: ImageProcessorPort,
): Promise<ProcessOutcome> {
  const asset = await repo.findById(input.mediaId);
  if (!asset || asset.status !== 'uploaded') {
    return { outcome: 'skip' };
  }

  try {
    const original = await storage.getObject(asset.originalKey);
    const processed = await processor.process(original);
    const previewKey = buildPreviewKey(asset.originalKey);
    await storage.putObject(previewKey, processed.buffer, processed.contentType);

    asset.markReady(previewKey);
    await repo.save(asset);
    return { outcome: 'processed', asset };
  } catch (error) {
    if (!(error instanceof PermanentMediaError) && !(error instanceof TransientMediaError)) {
      throw error;
    }
    const errorKind = error instanceof PermanentMediaError ? 'permanent' : 'transient';

    const next = decideNextAction(input.stage, errorKind);
    if (next.kind === 'retry') {
      return { outcome: 'retry', stage: next.stage, delayMs: next.delayMs, asset };
    }

    asset.markFailed(error.message);
    await repo.save(asset);
    return { outcome: 'dlq', asset, reason: error.message };
  }
}
