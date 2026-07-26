import { describe, expect, it, vi } from 'vitest';
import { InMemoryNotificationRepository } from './testing/in-memory-notification-repository.js';
import { InMemoryNotificationBus } from './testing/in-memory-notification-bus.js';
import { handleNotificationRequest } from './use-cases/handle-notification-request.usecase.js';
import { listNotifications } from './use-cases/list-notifications.usecase.js';

const USER = '11111111-1111-1111-1111-111111111111';
const OTHER_USER = '22222222-2222-2222-2222-222222222222';

describe('handleNotificationRequest', () => {
  it('saves the notification and publishes it live', async () => {
    const repo = new InMemoryNotificationRepository();
    const bus = new InMemoryNotificationBus();
    const notification = await handleNotificationRequest(
      { sourceEventId: 'evt-1', userId: USER, category: 'listing.approved', message: 'Одобрено' },
      repo,
      bus,
    );
    expect(notification?.message).toBe('Одобрено');
    expect(bus.published).toEqual([notification]);
    expect(await listNotifications(USER, repo)).toEqual([notification]);
  });

  it('is idempotent: redelivering the same sourceEventId neither saves nor publishes again', async () => {
    const repo = new InMemoryNotificationRepository();
    const bus = new InMemoryNotificationBus();
    const first = await handleNotificationRequest(
      { sourceEventId: 'evt-1', userId: USER, category: 'listing.approved', message: 'Одобрено' },
      repo,
      bus,
    );
    const second = await handleNotificationRequest(
      { sourceEventId: 'evt-1', userId: USER, category: 'listing.approved', message: 'Одобрено' },
      repo,
      bus,
    );
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(bus.published).toHaveLength(1);
    expect(await listNotifications(USER, repo)).toHaveLength(1);
  });

  it('only notifies subscribers for the matching userId', async () => {
    const repo = new InMemoryNotificationRepository();
    const bus = new InMemoryNotificationBus();
    const mineCallback = vi.fn();
    const othersCallback = vi.fn();
    bus.subscribe(USER, mineCallback);
    bus.subscribe(OTHER_USER, othersCallback);

    await handleNotificationRequest({ sourceEventId: 'evt-1', userId: USER, category: 'x', message: 'hi' }, repo, bus);

    expect(mineCallback).toHaveBeenCalledTimes(1);
    expect(othersCallback).not.toHaveBeenCalled();
  });

  it('unsubscribe stops delivery', async () => {
    const repo = new InMemoryNotificationRepository();
    const bus = new InMemoryNotificationBus();
    const callback = vi.fn();
    const unsubscribe = bus.subscribe(USER, callback);
    unsubscribe();

    await handleNotificationRequest({ sourceEventId: 'evt-1', userId: USER, category: 'x', message: 'hi' }, repo, bus);

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('listNotifications', () => {
  it('only returns the requested user’s notifications', async () => {
    const repo = new InMemoryNotificationRepository();
    const bus = new InMemoryNotificationBus();
    await handleNotificationRequest({ sourceEventId: 'evt-1', userId: USER, category: 'x', message: 'a' }, repo, bus);
    await handleNotificationRequest({ sourceEventId: 'evt-2', userId: OTHER_USER, category: 'x', message: 'b' }, repo, bus);

    const mine = await listNotifications(USER, repo);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.userId).toBe(USER);
  });
});
