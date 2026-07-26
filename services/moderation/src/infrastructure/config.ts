export interface ModerationServiceConfig {
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
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ModerationServiceConfig {
  return {
    httpPort: Number(env['MODERATION_HTTP_PORT'] ?? 3003),
    db: {
      host: env['POSTGRES_HOST'] ?? 'localhost',
      port: Number(env['POSTGRES_PORT'] ?? 5432),
      database: env['MODERATION_DB_NAME'] ?? 'moderation_db',
      user: env['MODERATION_DB_USER'] ?? 'moderation_svc',
      password: env['MODERATION_DB_PASSWORD'] ?? 'moderation_pw',
    },
    kafka: {
      brokers: (env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
      clientId: 'moderation',
    },
  };
}
