import { KafkaJS } from '@confluentinc/kafka-javascript';
import type { KafkaClientConfig } from './config.js';

const { Kafka } = KafkaJS;

export interface EventMessage {
  topic: string;
  partition: number;
  key: string | null;
  value: unknown;
  offset: string;
}

export type MessageHandler = (message: EventMessage) => Promise<void>;

export interface EventConsumer {
  start(topics: string[], handler: MessageHandler): Promise<void>;
  /**
   * `consumer.disconnect()` waits for the in-flight `eachMessage` call to
   * return before it actually tears the connection down, so calling this
   * from a SIGTERM handler is enough to get "finish what's in flight, then
   * stop" -- no separate draining flag needed.
   */
  shutdown(): Promise<void>;
}

export interface CreateConsumerOptions {
  /**
   * Only matters the first time this consumer group ever starts (after
   * that, the committed offset wins regardless). Set this for a consumer
   * that rebuilds a read-model from a compacted topic -- like `search` off
   * `listing.snapshot.v1` -- since starting from 'latest' would silently
   * skip everything compacted in before the consumer's first boot.
   */
  fromBeginning?: boolean;
}

export function createConsumer(
  config: KafkaClientConfig,
  groupId: string,
  options: CreateConsumerOptions = {},
): EventConsumer {
  const kafka = new Kafka();
  const consumer = kafka.consumer({
    'bootstrap.servers': config.brokers.join(','),
    'client.id': config.clientId,
    'group.id': groupId,
    // Off on purpose: committing before the handler finishes is the
    // single biggest way to silently lose a message under an otherwise
    // correct at-least-once setup. Commits happen explicitly below, after
    // the handler resolves.
    'enable.auto.commit': false,
    'auto.offset.reset': options.fromBeginning ? 'earliest' : 'latest',
  });

  return {
    async start(topics, handler) {
      await consumer.connect();
      await consumer.subscribe({ topics });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await handler({
            topic,
            partition,
            key: message.key ? message.key.toString() : null,
            value: message.value ? JSON.parse(message.value.toString()) : null,
            offset: message.offset,
          });
          await consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (parseInt(message.offset, 10) + 1).toString(),
            },
          ]);
        },
      });
    },
    async shutdown() {
      await consumer.disconnect();
    },
  };
}
