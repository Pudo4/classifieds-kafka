import type { Notification } from '../../domain/notification.js';
import type { NotificationRepositoryPort } from '../ports/notification-repository.port.js';

export class InMemoryNotificationRepository implements NotificationRepositoryPort {
  private readonly store: Notification[] = [];
  private readonly claimedEventIds = new Set<string>();

  async saveIdempotently(notification: Notification, sourceEventId: string): Promise<Notification | null> {
    if (this.claimedEventIds.has(sourceEventId)) return null;
    this.claimedEventIds.add(sourceEventId);
    this.store.push(notification);
    return notification;
  }

  async listByUser(userId: string): Promise<Notification[]> {
    return this.store.filter((n) => n.userId === userId);
  }
}
