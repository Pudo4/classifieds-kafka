import { UpstreamServiceError } from '../../application/errors.js';
import type { NotificationClientPort, NotificationSummary } from '../../application/ports/notification-client.port.js';
import { httpRequestJson } from './http-request.js';

export class NotificationHttpClient implements NotificationClientPort {
  constructor(private readonly baseUrl: string) {}

  list(userId: string): Promise<NotificationSummary[]> {
    return httpRequestJson(this.baseUrl, '/notifications', { userId });
  }

  /**
   * Not part of `NotificationClientPort` -- returns the raw upstream Fetch
   * `Response` so the controller (which already knows it's serving SSE
   * over HTTP) can pipe `.body` straight through. There's no business
   * logic here to isolate behind a port; it's just plumbing.
   */
  async openStream(userId: string, signal: AbortSignal): Promise<Response> {
    const response = await fetch(new URL('/notifications/stream', this.baseUrl), {
      headers: { 'X-User-Id': userId },
      signal,
    });
    if (!response.ok) {
      throw new UpstreamServiceError(response.status, `failed to open notification stream: ${response.status}`);
    }
    return response;
  }
}
