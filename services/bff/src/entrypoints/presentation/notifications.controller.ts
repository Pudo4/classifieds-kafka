import { Controller, Get, Req, Res } from '@nestjs/common';
import { CurrentUserId } from '@classifieds/platform';
// Must stay a value import: Nest's `emitDecoratorMetadata` needs the real
// class reference to populate `design:paramtypes` for constructor DI.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { NotificationHttpClient } from '../../infrastructure/http/notification-http-client.js';
import type { NotificationSummary } from '../../application/ports/notification-client.port.js';
import type { RawHttpRequest, RawHttpResponse } from '../../infrastructure/http/raw-http.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationClient: NotificationHttpClient) {}

  @Get()
  history(@CurrentUserId() userId: string): Promise<NotificationSummary[]> {
    return this.notificationClient.list(userId);
  }

  /**
   * Raw response handling (not a DTO return) because this proxies a
   * byte stream, not a JSON value -- piping `upstream.body` straight
   * through is both simpler and cheaper than parsing SSE frames just to
   * re-serialize identical ones. Aborting on client disconnect keeps an
   * upstream connection from leaking every time a browser tab closes.
   */
  @Get('stream')
  async stream(@CurrentUserId() userId: string, @Req() req: RawHttpRequest, @Res() res: RawHttpResponse): Promise<void> {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    const upstream = await this.notificationClient.openStream(userId, controller.signal);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });

    if (!upstream.body) {
      res.end();
      return;
    }
    try {
      for await (const chunk of upstream.body) {
        res.write(chunk);
      }
    } catch (error) {
      // The client disconnecting mid-stream aborts `controller.signal`,
      // which rejects this iteration with an AbortError -- expected on
      // every closed browser tab, not a real failure. Anything else is a
      // genuine upstream error, but by this point `writeHead` has already
      // gone out, so there's no response left to report it on; rethrowing
      // would only reach `AllExceptionsFilter` after headers are sent (see
      // its `headersSent` guard) and add nothing but a log line, so just
      // let it surface via the same log line here instead.
      if (!controller.signal.aborted) console.error('notification stream to upstream failed mid-stream', error);
    }
    res.end();
  }
}
