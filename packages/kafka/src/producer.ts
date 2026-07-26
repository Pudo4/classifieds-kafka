import { KafkaJS } from '@confluentinc/kafka-javascript';
import type { KafkaClientConfig } from './config.js';

const { Kafka } = KafkaJS;

export interface PublishParams {
  topic: string;
  /** Always the aggregate id -- see README: without a key, ordering within an entity breaks. */
  key: string;
  /** `null` publishes a Kafka tombstone (a compacted-topic delete marker), not a JSON null. */
  value: Record<string, unknown> | null;
}

export interface EventProducer {
  publish(params: PublishParams): Promise<void>;
  disconnect(): Promise<void>;
}

export function createProducer(config: KafkaClientConfig): EventProducer {
  const kafka = new Kafka();
  const producer = kafka.producer({
    'bootstrap.servers': config.brokers.join(','),
    'client.id': config.clientId,
    // Both set explicitly, not left to defaults: acks=1 would ack once the
    // leader (the only replica at RF=1) has the record in its local log
    // buffer, which is not the same as it being durably flushed/replicated;
    // idempotence prevents duplicate writes when the producer retries a send
    // it never got an ack for. -1 is librdkafka's numeric form of "all".
    'enable.idempotence': true,
    acks: -1,
  });

  let connected = false;

  async function ensureConnected(): Promise<void> {
    if (!connected) {
      await producer.connect();
      connected = true;
    }
  }

  return {
    async publish({ topic, key, value }) {
      if (!key) {
        throw new Error(`refusing to publish to "${topic}" without a partition key`);
      }
      await ensureConnected();
      await producer.send({
        topic,
        messages: [{ key, value: value === null ? null : JSON.stringify(value) }],
      });
    },
    async disconnect() {
      if (connected) {
        await producer.disconnect();
        connected = false;
      }
    },
  };
}
