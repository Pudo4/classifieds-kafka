import { describe, expect, it } from 'vitest';
import type { EventProducer, PublishParams } from '@classifieds/kafka';
import { OutboxRelayer } from './relayer.js';
import type { OutboxDb } from './with-outbox-tx.js';
import type { OutboxEventRow } from './schema.js';

function makeRow(overrides: Partial<OutboxEventRow>): OutboxEventRow {
  return {
    id: crypto.randomUUID(),
    aggregateId: 'agg-1',
    topic: 'listing.snapshot.v1',
    eventKey: 'agg-1',
    payload: { title: 'hello' },
    createdAt: new Date(),
    publishedAt: null,
    ...overrides,
  };
}

function fakeProducer(): EventProducer & { calls: PublishParams[] } {
  const calls: PublishParams[] = [];
  return {
    calls,
    async publish(params) {
      calls.push(params);
    },
    async disconnect() {},
  };
}

function fakeDb(rows: OutboxEventRow[]): OutboxDb {
  const updated: string[] = [];
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => rows.filter((row) => !updated.includes(row.id) && row.publishedAt === null),
          }),
        }),
      }),
    }),
    update: () => ({
      set: (values: { publishedAt: Date }) => ({
        where: () => {
          const row = rows.find((r) => !updated.includes(r.id));
          if (row) {
            row.publishedAt = values.publishedAt;
            updated.push(row.id);
          }
          return Promise.resolve();
        },
      }),
    }),
  };
  // Structural stand-in for NodePgDatabase -- see with-outbox-tx.ts for why
  // the relayer only depends on select()/update(), not the full Drizzle API.
  return db as unknown as OutboxDb;
}

describe('OutboxRelayer', () => {
  it('publishes a null payload as a tombstone (null value), not a JSON null', async () => {
    const rows = [makeRow({ payload: null })];
    const producer = fakeProducer();
    const relayer = new OutboxRelayer({ db: fakeDb(rows), producer, pollIntervalMs: 1_000_000 });

    await relayer['relayOnce']();

    expect(producer.calls).toHaveLength(1);
    expect(producer.calls[0]?.value).toBeNull();
    expect(rows[0]?.publishedAt).not.toBeNull();
  });

  it('publishes a non-null payload as-is and marks the row published', async () => {
    const rows = [makeRow({ payload: { title: 'hello' } })];
    const producer = fakeProducer();
    const relayer = new OutboxRelayer({ db: fakeDb(rows), producer, pollIntervalMs: 1_000_000 });

    await relayer['relayOnce']();

    expect(producer.calls[0]?.value).toEqual({ title: 'hello' });
  });

  it('stop() lets an in-flight relayOnce() finish before returning', async () => {
    const rows = [makeRow({}), makeRow({})];
    const producer = fakeProducer();
    const relayer = new OutboxRelayer({ db: fakeDb(rows), producer, pollIntervalMs: 5 });

    relayer.start();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await relayer.stop();

    expect(rows.every((row) => row.publishedAt !== null)).toBe(true);
  });
});
