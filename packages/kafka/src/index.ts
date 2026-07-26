export type { KafkaClientConfig } from './config.js';
export { createProducer } from './producer.js';
export type { EventProducer, PublishParams } from './producer.js';
export { createConsumer } from './consumer.js';
export type { CreateConsumerOptions, EventConsumer, EventMessage, MessageHandler } from './consumer.js';
export { onShutdownSignal } from './graceful-shutdown.js';
