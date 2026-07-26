import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter, isHttpMappedError } from './errors.js';

class NotFoundError extends Error {
  readonly httpStatus = 404;
}

describe('isHttpMappedError', () => {
  it('recognizes an error exposing a numeric httpStatus', () => {
    expect(isHttpMappedError(new NotFoundError('missing'))).toBe(true);
  });

  it('rejects a plain error', () => {
    expect(isHttpMappedError(new Error('boom'))).toBe(false);
  });

  it('rejects non-error values', () => {
    expect(isHttpMappedError({ httpStatus: 404 })).toBe(false);
  });
});

function fakeHost(response: { headersSent: boolean; status: (code: number) => { json: (body: unknown) => void } }): ArgumentsHost {
  return { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  it('does not attempt to write a response once headers were already sent', () => {
    // Regression test: a raw (`@Res()`) SSE/file-proxy handler can throw
    // (e.g. client disconnect) after `writeHead` already ran. Calling
    // `.json()` in that case throws ERR_HTTP_HEADERS_SENT and crashes the
    // whole process -- this must be a no-op instead, see bff's
    // notifications SSE proxy for the real-world case that found this.
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const logger = { warn: vi.fn(), error: vi.fn() };
    const filter = new AllExceptionsFilter(logger as never);

    filter.catch(new Error('boom'), fakeHost({ headersSent: true, status }));

    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('writes a JSON error response when headers were not sent yet', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const logger = { warn: vi.fn(), error: vi.fn() };
    const filter = new AllExceptionsFilter(logger as never);

    filter.catch(new NotFoundError('missing'), fakeHost({ headersSent: false, status }));

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'missing' });
  });
});
