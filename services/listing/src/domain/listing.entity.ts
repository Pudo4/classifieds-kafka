import { InvalidTransitionError, ListingNotEditableError } from './listing.errors.js';

export const LISTING_STATUSES = ['draft', 'pending', 'active', 'rejected', 'archived'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

const ALLOWED_TRANSITIONS: Readonly<Record<ListingStatus, readonly ListingStatus[]>> = {
  draft: ['pending', 'archived'],
  pending: ['active', 'rejected', 'archived'],
  active: ['archived'],
  rejected: ['pending', 'archived'],
  archived: [],
};

const EDITABLE_STATUSES: readonly ListingStatus[] = ['draft', 'rejected'];

export interface ListingProps {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  status: ListingStatus;
  rejectionReason: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListingParams {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
}

export interface ListingDetailsPatch {
  title?: string;
  description?: string;
  priceCents?: number;
  category?: string;
}

export type ListingDomainEvent =
  | { type: 'created'; listing: ListingProps }
  | { type: 'updated'; listing: ListingProps }
  | { type: 'submitted'; listing: ListingProps }
  | { type: 'approved'; listing: ListingProps }
  | { type: 'rejected'; listing: ListingProps; reason: string }
  | { type: 'archived'; listing: ListingProps };

/**
 * Aggregate root. Every state change goes through a method here -- there is
 * no setter for `status`, so an invalid transition is a thrown error, not a
 * possible-but-wrong value living in the database.
 */
export class Listing {
  private events: ListingDomainEvent[] = [];

  private constructor(private props: ListingProps) {}

  static create(params: CreateListingParams): Listing {
    const now = new Date();
    const listing = new Listing({
      id: params.id,
      ownerId: params.ownerId,
      title: params.title,
      description: params.description,
      priceCents: params.priceCents,
      category: params.category,
      status: 'draft',
      rejectionReason: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    listing.record({ type: 'created', listing: listing.toSnapshot() });
    return listing;
  }

  /** Rehydrates from persistence -- does not raise domain events. */
  static fromPersistence(props: ListingProps): Listing {
    return new Listing(props);
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get status(): ListingStatus {
    return this.props.status;
  }

  updateDetails(patch: ListingDetailsPatch): void {
    if (!EDITABLE_STATUSES.includes(this.props.status)) {
      throw new ListingNotEditableError(this.props.status);
    }
    this.props = {
      ...this.props,
      ...patch,
      updatedAt: new Date(),
      version: this.props.version + 1,
    };
    this.record({ type: 'updated', listing: this.toSnapshot() });
  }

  submit(): void {
    this.transition('pending');
    this.props.rejectionReason = null;
    this.record({ type: 'submitted', listing: this.toSnapshot() });
  }

  approve(): void {
    this.transition('active');
    this.record({ type: 'approved', listing: this.toSnapshot() });
  }

  reject(reason: string): void {
    this.transition('rejected');
    this.props.rejectionReason = reason;
    this.record({ type: 'rejected', listing: this.toSnapshot(), reason });
  }

  archive(): void {
    this.transition('archived');
    this.record({ type: 'archived', listing: this.toSnapshot() });
  }

  /** Drains and returns events raised since the last call -- the repository calls this once per save(). */
  pullDomainEvents(): ListingDomainEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  toSnapshot(): ListingProps {
    return { ...this.props };
  }

  private transition(to: ListingStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this.props.status];
    if (!allowed.includes(to)) {
      throw new InvalidTransitionError(this.props.status, to);
    }
    this.props.status = to;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  private record(event: ListingDomainEvent): void {
    this.events.push(event);
  }
}
