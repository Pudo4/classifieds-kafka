import type { Notification } from '../../domain/notification.js';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface NotificationRepositoryPort {
  /** Atomically claims `sourceEventId` and inserts the row. Returns `null` on a duplicate delivery. */
  saveIdempotently(notification: Notification, sourceEventId: string): Promise<Notification | null>;
  listByUser(userId: string): Promise<Notification[]>;
}
