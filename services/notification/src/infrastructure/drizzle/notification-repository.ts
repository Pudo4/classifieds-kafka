import { eq } from 'drizzle-orm';
import { claimEvent } from '@classifieds/idempotency';
import type { Notification } from '../../domain/notification.js';
import type { NotificationRepositoryPort } from '../../application/ports/notification-repository.port.js';
import type { Db } from './db.js';
import { notifications, type NotificationRow } from './schema.js';

const CONSUMER_GROUP = 'notification';

function toNotification(row: NotificationRow): Notification {
  return { id: row.id, userId: row.userId, category: row.category, message: row.message, createdAt: row.createdAt };
}

export class DrizzleNotificationRepository implements NotificationRepositoryPort {
  constructor(private readonly db: Db) {}

  async saveIdempotently(notification: Notification, sourceEventId: string): Promise<Notification | null> {
    return this.db.transaction(async (tx) => {
      const claimed = await claimEvent(tx, CONSUMER_GROUP, sourceEventId);
      if (!claimed) return null;
      await tx.insert(notifications).values(notification);
      return notification;
    });
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const rows = await this.db.select().from(notifications).where(eq(notifications.userId, userId));
    return rows.map(toNotification);
  }
}
