import { randomUUID } from 'node:crypto';
import type { Notification } from '../../domain/notification.js';
import type { NotificationRepositoryPort } from '../ports/notification-repository.port.js';
import type { NotificationBusPort } from '../ports/notification-bus.port.js';

export interface HandleNotificationRequestInput {
  sourceEventId: string;
  userId: string;
  category: string;
  message: string;
}

/** Returns `null` when `sourceEventId` was already handled (duplicate delivery) -- nothing new happened, nothing published live. */
export async function handleNotificationRequest(
  input: HandleNotificationRequestInput,
  repo: NotificationRepositoryPort,
  bus: NotificationBusPort,
): Promise<Notification | null> {
  const notification: Notification = {
    id: randomUUID(),
    userId: input.userId,
    category: input.category,
    message: input.message,
    createdAt: new Date(),
  };

  const saved = await repo.saveIdempotently(notification, input.sourceEventId);
  if (saved) bus.publish(saved);
  return saved;
}
