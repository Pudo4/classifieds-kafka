import type { Notification } from '../../domain/notification.js';

export interface NotificationResponse {
  id: string;
  category: string;
  message: string;
  createdAt: string;
}

export function toNotificationResponse(notification: Notification): NotificationResponse {
  return {
    id: notification.id,
    category: notification.category,
    message: notification.message,
    createdAt: notification.createdAt.toISOString(),
  };
}
