import { MediaNotPendingError } from './media-errors.js';

export const MEDIA_STATUSES = ['uploaded', 'ready', 'failed'] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export interface MediaAssetProps {
  id: string;
  listingId: string;
  ownerId: string;
  originalKey: string;
  previewKey: string | null;
  status: MediaStatus;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMediaAssetParams {
  id: string;
  listingId: string;
  ownerId: string;
  originalKey: string;
}

export type MediaDomainEvent =
  | { type: 'uploaded'; asset: MediaAssetProps }
  | { type: 'processed'; asset: MediaAssetProps }
  | { type: 'failed'; asset: MediaAssetProps; reason: string };

/**
 * Deliberately simple compared to `Listing`: there's no resubmission or
 * multi-step workflow here, just "uploaded" fanning out to exactly one of
 * two terminal states. Retry attempts happen entirely at the Kafka/infra
 * level (see domain/retry-policy.ts) -- they never touch this aggregate,
 * because retrying is "try processing again", not a state the asset itself
 * is ever in.
 */
export class MediaAsset {
  private events: MediaDomainEvent[] = [];

  private constructor(private props: MediaAssetProps) {}

  static create(params: CreateMediaAssetParams): MediaAsset {
    const now = new Date();
    const asset = new MediaAsset({
      ...params,
      previewKey: null,
      status: 'uploaded',
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    });
    asset.record({ type: 'uploaded', asset: asset.toSnapshot() });
    return asset;
  }

  static fromPersistence(props: MediaAssetProps): MediaAsset {
    return new MediaAsset(props);
  }

  get id(): string {
    return this.props.id;
  }

  get status(): MediaStatus {
    return this.props.status;
  }

  get originalKey(): string {
    return this.props.originalKey;
  }

  markReady(previewKey: string): void {
    if (this.props.status !== 'uploaded') {
      throw new MediaNotPendingError(this.props.status);
    }
    this.props.status = 'ready';
    this.props.previewKey = previewKey;
    this.props.updatedAt = new Date();
    this.record({ type: 'processed', asset: this.toSnapshot() });
  }

  markFailed(reason: string): void {
    if (this.props.status !== 'uploaded') {
      throw new MediaNotPendingError(this.props.status);
    }
    this.props.status = 'failed';
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
    this.record({ type: 'failed', asset: this.toSnapshot(), reason });
  }

  pullDomainEvents(): MediaDomainEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  toSnapshot(): MediaAssetProps {
    return { ...this.props };
  }

  private record(event: MediaDomainEvent): void {
    this.events.push(event);
  }
}
