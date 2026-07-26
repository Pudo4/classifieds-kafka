import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type pino from 'pino';

/**
 * Domain/application errors don't import Nest or this package (see the
 * layering rule in the README) -- so this filter can't `instanceof` a
 * specific domain error class. Instead a domain error just needs to expose
 * a numeric `httpStatus`, which this filter picks up structurally.
 */
export interface HttpMappedError extends Error {
  readonly httpStatus: number;
}

export function isHttpMappedError(error: unknown): error is HttpMappedError {
  return error instanceof Error && typeof Reflect.get(error, 'httpStatus') === 'number';
}

interface MinimalHttpResponse {
  readonly headersSent: boolean;
  status(code: number): { json(body: unknown): void };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: pino.Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<MinimalHttpResponse>();

    if (response.headersSent) {
      // A raw (`@Res()`) handler already started writing a response --
      // SSE proxy, file proxy -- before this exception fired. Calling
      // `.json()` now would throw ERR_HTTP_HEADERS_SENT synchronously and
      // crash the whole process; nothing can be sent to the client at
      // this point, so just log it.
      this.logger.error({ err: exception }, 'unhandled exception after headers already sent');
      return;
    }

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (isHttpMappedError(exception)) {
      this.logger.warn({ err: exception }, exception.message);
      response.status(exception.httpStatus).json({ message: exception.message });
      return;
    }

    this.logger.error({ err: exception }, 'unhandled exception');
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'internal server error' });
  }
}
