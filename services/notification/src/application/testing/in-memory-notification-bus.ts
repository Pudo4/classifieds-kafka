import type { Notification } from '../../domain/notification.js';
import type { NotificationBusPort } from '../ports/notification-bus.port.js';

export class InMemoryNotificationBus implements NotificationBusPort {
  readonly published: Notification[] = [];
  private readonly subscribers = new Map<string, Set<(notification: Notification) => void>>();

  publish(notification: Notification): void {
    this.published.push(notification);
    for (const callback of this.subscribers.get(notification.userId) ?? []) {
      callback(notification);
    }
  }

  subscribe(userId: string, onNotification: (notification: Notification) => void): () => void {
    const set = this.subscribers.get(userId) ?? new Set();
    set.add(onNotification);
    this.subscribers.set(userId, set);
    return () => set.delete(onNotification);
  }
}
