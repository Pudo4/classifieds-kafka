export class MediaNotPendingError extends Error {
  readonly httpStatus = 409;
  constructor(status: string) {
    super(`media asset cannot be updated while status is "${status}"`);
  }
}

/** Thrown by the object storage adapter for I/O failures that might succeed on retry (MinIO unreachable, timeout, ...). */
export class TransientMediaError extends Error {
  readonly httpStatus = 503;
}

/** Thrown by the image processor for data that will never process successfully (not a real image, unsupported format). */
export class PermanentMediaError extends Error {
  readonly httpStatus = 422;
}
