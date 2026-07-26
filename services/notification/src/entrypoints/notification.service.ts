import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, type NotificationRepositoryPort } from '../application/ports/notification-repository.port.js';
import { NOTIFICATION_BUS, type NotificationBusPort } from '../application/ports/notification-bus.port.js';
import { listNotifications } from '../application/use-cases/list-notifications.usecase.js';
import type { Notification } from '../domain/notification.js';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: NotificationRepositoryPort,
    @Inject(NOTIFICATION_BUS) private readonly bus: NotificationBusPort,
  ) {}

  list(userId: string): Promise<Notification[]> {
    return listNotifications(userId, this.repo);
  }

  subscribe(userId: string, onNotification: (notification: Notification) => void): () => void {
    return this.bus.subscribe(userId, onNotification);
  }
}
