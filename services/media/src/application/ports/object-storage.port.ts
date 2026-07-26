export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface ObjectStoragePort {
  /** Throws `TransientMediaError` on I/O failure -- see domain/media-errors.ts. */
  putObject(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Throws `TransientMediaError` on I/O failure. */
  getObject(key: string): Promise<Buffer>;
}
