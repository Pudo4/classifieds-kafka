export interface NotificationServiceConfig {
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): NotificationServiceConfig {
  return {
    httpPort: Number(env['NOTIFICATION_HTTP_PORT'] ?? 3006),
    db: {
      host: env['POSTGRES_HOST'] ?? 'localhost',
      port: Number(env['POSTGRES_PORT'] ?? 5432),
      database: env['NOTIFICATION_DB_NAME'] ?? 'notifications_db',
      user: env['NOTIFICATION_DB_USER'] ?? 'notification_svc',
      password: env['NOTIFICATION_DB_PASSWORD'] ?? 'notification_pw',
    },
    kafka: {
      brokers: (env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
      clientId: 'notification',
    },
  };
}
