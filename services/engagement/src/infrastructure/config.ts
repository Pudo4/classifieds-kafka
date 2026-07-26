export interface EngagementServiceConfig {
  httpPort: number;
  db: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
  };
  redis: {
    host: string;
    port: number;
  };
  /** How often the buffered view counters get applied to Postgres and published. */
  viewFlushIntervalMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EngagementServiceConfig {
  return {
    httpPort: Number(env['ENGAGEMENT_HTTP_PORT'] ?? 3005),
    db: {
      host: env['POSTGRES_HOST'] ?? 'localhost',
      port: Number(env['POSTGRES_PORT'] ?? 5432),
      database: env['ENGAGEMENT_DB_NAME'] ?? 'engagement_db',
      user: env['ENGAGEMENT_DB_USER'] ?? 'engagement_svc',
      password: env['ENGAGEMENT_DB_PASSWORD'] ?? 'engagement_pw',
    },
    kafka: {
      brokers: (env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
      clientId: 'engagement',
    },
    redis: {
      host: env['REDIS_HOST'] ?? 'localhost',
      port: Number(env['REDIS_PORT'] ?? 6379),
    },
    viewFlushIntervalMs: Number(env['ENGAGEMENT_VIEW_FLUSH_INTERVAL_MS'] ?? 5000),
  };
}
