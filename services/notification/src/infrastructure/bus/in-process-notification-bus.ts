import { EventEmitter } from 'node:events';
import type { Notification } from '../../domain/notification.js';
import type { NotificationBusPort } from '../../application/ports/notification-bus.port.js';

/**
 * Live delivery only works for SSE connections held by *this* process --
 * fine at this project's scale (a single instance), but note for later:
 * running more than one instance of this service would need a shared bus
 * (e.g. Redis pub/sub) for a connection on instance A to hear about a
 * notification produced while instance B did the consuming.
 */
export class InProcessNotificationBus implements NotificationBusPort {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Default of 10 would warn once more than 10 browsers have an SSE
    // connection open at the same time -- a normal, non-leak scenario here.
    this.emitter.setMaxListeners(0);
  }

  publish(notification: Notification): void {
    this.emitter.emit(notification.userId, notification);
  }

  subscribe(userId: string, onNotification: (notification: Notification) => void): () => void {
    this.emitter.on(userId, onNotification);
    return () => this.emitter.off(userId, onNotification);
  }
}
