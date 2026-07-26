import { describe, expect, it } from 'vitest';
import { Listing, LISTING_STATUSES, type ListingStatus } from './listing.entity.js';
import { InvalidTransitionError, ListingNotEditableError } from './listing.errors.js';

function createDraft(): Listing {
  return Listing.create({
    id: 'listing-1',
    ownerId: 'owner-1',
    title: 'Bike',
    description: 'A bike',
    priceCents: 1000,
    category: 'sports',
  });
}

describe('Listing.create', () => {
  it('starts in draft with version 1 and raises a "created" event', () => {
    const listing = createDraft();
    expect(listing.status).toBe('draft');
    const events = listing.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'created', listing: { status: 'draft', version: 1 } });
  });

  it('pullDomainEvents() drains the queue -- a second call returns nothing new', () => {
    const listing = createDraft();
    listing.pullDomainEvents();
    expect(listing.pullDomainEvents()).toHaveLength(0);
  });
});

describe('allowed transitions', () => {
  it('draft -> pending -> active', () => {
    const listing = createDraft();
    listing.submit();
    expect(listing.status).toBe('pending');
    listing.approve();
    expect(listing.status).toBe('active');
  });

  it('draft -> pending -> rejected -> pending (resubmit) -> active', () => {
    const listing = createDraft();
    listing.submit();
    listing.reject('stop word in title');
    expect(listing.status).toBe('rejected');
    listing.submit();
    expect(listing.status).toBe('pending');
    listing.approve();
    expect(listing.status).toBe('active');
  });

  it.each<ListingStatus>(['draft', 'pending', 'active', 'rejected'])('%s -> archived', (from) => {
    const listing = createDraft();
    if (from === 'pending' || from === 'active' || from === 'rejected') listing.submit();
    if (from === 'active') listing.approve();
    if (from === 'rejected') listing.reject('bad price');
    listing.archive();
    expect(listing.status).toBe('archived');
  });

  it('resubmitting after rejection clears the rejection reason', () => {
    const listing = createDraft();
    listing.submit();
    listing.reject('bad title');
    listing.submit();
    listing.approve();
    expect(listing.toSnapshot().rejectionReason).toBeNull();
  });

  it('bumps version on every transition', () => {
    const listing = createDraft();
    expect(listing.toSnapshot().version).toBe(1);
    listing.submit();
    expect(listing.toSnapshot().version).toBe(2);
    listing.approve();
    expect(listing.toSnapshot().version).toBe(3);
  });
});

describe('forbidden transitions', () => {
  it('draft -> active is rejected', () => {
    const listing = createDraft();
    expect(() => listing.approve()).toThrow(InvalidTransitionError);
  });

  it('draft -> rejected is rejected', () => {
    const listing = createDraft();
    expect(() => listing.reject('no')).toThrow(InvalidTransitionError);
  });

  it('active -> pending is rejected', () => {
    const listing = createDraft();
    listing.submit();
    listing.approve();
    expect(() => listing.submit()).toThrow(InvalidTransitionError);
  });

  it('active -> rejected is rejected', () => {
    const listing = createDraft();
    listing.submit();
    listing.approve();
    expect(() => listing.reject('too late')).toThrow(InvalidTransitionError);
  });

  it('archived is a dead end for every transition', () => {
    const listing = createDraft();
    listing.archive();
    expect(() => listing.submit()).toThrow(InvalidTransitionError);
    expect(() => listing.approve()).toThrow(InvalidTransitionError);
    expect(() => listing.reject('no')).toThrow(InvalidTransitionError);
    expect(() => listing.archive()).toThrow(InvalidTransitionError);
  });

  it('pending -> pending (double submit) is rejected', () => {
    const listing = createDraft();
    listing.submit();
    expect(() => listing.submit()).toThrow(InvalidTransitionError);
  });

  it('rejected -> active (skipping resubmission) is rejected', () => {
    const listing = createDraft();
    listing.submit();
    listing.reject('bad title');
    expect(() => listing.approve()).toThrow(InvalidTransitionError);
  });
});

describe('every declared status is reachable and terminal states are exhaustive', () => {
  it('LISTING_STATUSES matches the five states the state machine defines', () => {
    expect(new Set(LISTING_STATUSES)).toEqual(new Set<ListingStatus>(['draft', 'pending', 'active', 'rejected', 'archived']));
  });
});

describe('updateDetails', () => {
  it('is allowed while draft', () => {
    const listing = createDraft();
    listing.updateDetails({ title: 'Better bike' });
    expect(listing.toSnapshot().title).toBe('Better bike');
  });

  it('is allowed while rejected', () => {
    const listing = createDraft();
    listing.submit();
    listing.reject('bad');
    listing.updateDetails({ title: 'Fixed title' });
    expect(listing.toSnapshot().title).toBe('Fixed title');
  });

  it('is forbidden while pending', () => {
    const listing = createDraft();
    listing.submit();
    expect(() => listing.updateDetails({ title: 'x' })).toThrow(ListingNotEditableError);
  });

  it('is forbidden while active', () => {
    const listing = createDraft();
    listing.submit();
    listing.approve();
    expect(() => listing.updateDetails({ title: 'x' })).toThrow(ListingNotEditableError);
  });

  it('is forbidden while archived', () => {
    const listing = createDraft();
    listing.archive();
    expect(() => listing.updateDetails({ title: 'x' })).toThrow(ListingNotEditableError);
  });
});
