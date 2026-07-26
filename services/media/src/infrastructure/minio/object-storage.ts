import type { Client } from 'minio';
import { TransientMediaError } from '../../domain/media-errors.js';
import type { ObjectStoragePort } from '../../application/ports/object-storage.port.js';
import { errorMessage } from '../error-message.js';

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export class MinioObjectStorage implements ObjectStoragePort {
  constructor(
    private readonly client: Client,
    private readonly bucket: string,
  ) {}

  async putObject(key: string, data: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.putObject(this.bucket, key, data, data.length, { 'Content-Type': contentType });
    } catch (error) {
      throw new TransientMediaError(`failed to write "${key}" to object storage: ${errorMessage(error)}`);
    }
  }

  async getObject(key: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucket, key);
      return await streamToBuffer(stream);
    } catch (error) {
      // Every failure here (network, missing key, ...) is treated as
      // transient -- see ObjectStoragePort. A key that's genuinely never
      // going to exist just rides the retry ladder to the DLQ instead of
      // failing faster; acceptable for how rarely that should ever happen
      // given the original is always written before it's referenced.
      throw new TransientMediaError(`failed to read "${key}" from object storage: ${errorMessage(error)}`);
    }
  }
}
