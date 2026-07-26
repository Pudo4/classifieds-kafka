import type { Notification } from '../../domain/notification.js';

export const NOTIFICATION_BUS = Symbol('NOTIFICATION_BUS');

/**
 * Live delivery to whatever SSE connections are currently open -- separate
 * from the repository on purpose: history (Postgres) and "push this to
 * anyone listening right now" (this) are different concerns with
 * different failure modes. A message can be saved with nobody connected to
 * receive it live; that's fine, it's still in their history.
 */
export interface NotificationBusPort {
  publish(notification: Notification): void;
  /** Returns an unsubscribe function. */
  subscribe(userId: string, onNotification: (notification: Notification) => void): () => void;
}
