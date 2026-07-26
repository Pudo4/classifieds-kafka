import type { ListingStatus } from './listing.entity.js';

/** Carries `httpStatus` so `@classifieds/platform`'s exception filter can map it without importing this class. */
export class InvalidTransitionError extends Error {
  readonly httpStatus = 409;
  constructor(from: ListingStatus, to: ListingStatus) {
    super(`cannot transition listing from "${from}" to "${to}"`);
  }
}

export class ListingNotEditableError extends Error {
  readonly httpStatus = 409;
  constructor(status: ListingStatus) {
    super(`listing cannot be edited while status is "${status}"`);
  }
}
