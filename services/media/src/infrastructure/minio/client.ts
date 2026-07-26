import { Client } from 'minio';
import type { MediaServiceConfig } from '../config.js';

export function createMinioClient(config: MediaServiceConfig['minio']): Client {
  return new Client({
    endPoint: config.endPoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });
}

/** Idempotent: safe to call on every service startup. */
export async function ensureBucket(client: Client, bucket: string): Promise<void> {
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
  }
}
