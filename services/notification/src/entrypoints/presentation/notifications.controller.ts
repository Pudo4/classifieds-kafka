import { Controller, Get, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CurrentUserId } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI --
// `import type` would erase it and break resolution at runtime.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { NotificationService } from '../notification.service.js';
import { toNotificationResponse, type NotificationResponse } from './notification.response.js';

interface SseMessage {
  data: NotificationResponse;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * One open connection per browser tab; `subscribe()`'s unsubscribe
   * function runs when the client disconnects (RxJS calls the teardown
   * function returned from the Observable constructor), so a closed tab
   * doesn't leak a listener on the in-process bus.
   */
  @Sse('stream')
  stream(@CurrentUserId() userId: string): Observable<SseMessage> {
    return new Observable<SseMessage>((subscriber) => {
      const unsubscribe = this.notificationService.subscribe(userId, (notification) => {
        subscriber.next({ data: toNotificationResponse(notification) });
      });
      return unsubscribe;
    });
  }

  @Get()
  async history(@CurrentUserId() userId: string): Promise<NotificationResponse[]> {
    const notifications = await this.notificationService.list(userId);
    return notifications.map(toNotificationResponse);
  }
}
