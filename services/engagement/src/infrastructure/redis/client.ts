import { Redis } from 'ioredis';
import type { EngagementServiceConfig } from '../config.js';

export function createRedisClient(config: EngagementServiceConfig['redis']): Redis {
  return new Redis({ host: config.host, port: config.port });
}
