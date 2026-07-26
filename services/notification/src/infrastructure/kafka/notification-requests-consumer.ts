import { createConsumer, type EventConsumer } from '@classifieds/kafka';
import { NOTIFICATION_REQUESTS_TOPIC, notificationRequestEventSchema } from '@classifieds/contracts';
import type pino from 'pino';
import type { NotificationServiceConfig } from '../config.js';
import type { NotificationRepositoryPort } from '../../application/ports/notification-repository.port.js';
import type { NotificationBusPort } from '../../application/ports/notification-bus.port.js';
import { handleNotificationRequest } from '../../application/use-cases/handle-notification-request.usecase.js';

const CONSUMER_GROUP = 'notification';

export async function startNotificationRequestsConsumer(
  config: NotificationServiceConfig['kafka'],
  repo: NotificationRepositoryPort,
  bus: NotificationBusPort,
  logger: pino.Logger,
): Promise<EventConsumer> {
  const consumer = createConsumer(config, CONSUMER_GROUP);

  await consumer.start([NOTIFICATION_REQUESTS_TOPIC], async (message) => {
    const parsed = notificationRequestEventSchema.safeParse(message.value);
    if (!parsed.success) {
      throw new Error(`invalid ${NOTIFICATION_REQUESTS_TOPIC} payload: ${parsed.error.message}`);
    }

    const saved = await handleNotificationRequest(
      {
        sourceEventId: parsed.data.eventId,
        userId: parsed.data.payload.userId,
        category: parsed.data.payload.category,
        message: parsed.data.payload.message,
      },
      repo,
      bus,
    );

    if (saved) {
      logger.info({ userId: saved.userId, category: saved.category }, 'delivered notification');
    }
  });

  return consumer;
}
