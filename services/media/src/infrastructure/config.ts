export interface MediaServiceConfig {
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
  minio: {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): MediaServiceConfig {
  return {
    httpPort: Number(env['MEDIA_HTTP_PORT'] ?? 3004),
    db: {
      host: env['POSTGRES_HOST'] ?? 'localhost',
      port: Number(env['POSTGRES_PORT'] ?? 5432),
      database: env['MEDIA_DB_NAME'] ?? 'media_db',
      user: env['MEDIA_DB_USER'] ?? 'media_svc',
      password: env['MEDIA_DB_PASSWORD'] ?? 'media_pw',
    },
    kafka: {
      brokers: (env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
      clientId: 'media',
    },
    minio: {
      endPoint: env['MINIO_HOST'] ?? 'localhost',
      port: Number(env['MINIO_API_PORT'] ?? 9000),
      useSSL: false,
      accessKey: env['MINIO_ROOT_USER'] ?? 'minioadmin',
      secretKey: env['MINIO_ROOT_PASSWORD'] ?? 'minioadmin',
      bucket: 'media',
    },
  };
}
