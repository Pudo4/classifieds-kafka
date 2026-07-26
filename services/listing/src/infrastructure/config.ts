export interface ListingConfig {
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ListingConfig {
  return {
    httpPort: Number(env['LISTING_HTTP_PORT'] ?? 3001),
    db: {
      host: env['POSTGRES_HOST'] ?? 'localhost',
      port: Number(env['POSTGRES_PORT'] ?? 5432),
      database: env['LISTING_DB_NAME'] ?? 'listings_db',
      user: env['LISTING_DB_USER'] ?? 'listing_svc',
      password: env['LISTING_DB_PASSWORD'] ?? 'listing_pw',
    },
    kafka: {
      brokers: (env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
      clientId: 'listing',
    },
  };
}
