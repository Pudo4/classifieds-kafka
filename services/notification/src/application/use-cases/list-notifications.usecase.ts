import type { Notification } from '../../domain/notification.js';
import type { NotificationRepositoryPort } from '../ports/notification-repository.port.js';

export async function listNotifications(userId: string, repo: NotificationRepositoryPort): Promise<Notification[]> {
  return repo.listByUser(userId);
}
