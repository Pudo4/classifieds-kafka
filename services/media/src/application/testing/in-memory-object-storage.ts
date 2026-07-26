import { TransientMediaError } from '../../domain/media-errors.js';
import type { ObjectStoragePort } from '../ports/object-storage.port.js';

export class InMemoryObjectStorage implements ObjectStoragePort {
  private readonly store = new Map<string, Buffer>();
  /** Set to make the next N put/get calls throw TransientMediaError, simulating a flaky store. */
  failNextCalls = 0;

  private maybeFail(): void {
    if (this.failNextCalls > 0) {
      this.failNextCalls -= 1;
      throw new TransientMediaError('simulated object storage failure');
    }
  }

  async putObject(key: string, data: Buffer): Promise<void> {
    this.maybeFail();
    this.store.set(key, data);
  }

  async getObject(key: string): Promise<Buffer> {
    this.maybeFail();
    const data = this.store.get(key);
    if (!data) throw new Error(`no object at key "${key}"`);
    return data;
  }
}
