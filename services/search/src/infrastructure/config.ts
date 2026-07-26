export interface SearchConfig {
  httpPort: number;
  meili: {
    host: string;
    apiKey: string;
    indexName: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SearchConfig {
  return {
    httpPort: Number(env['SEARCH_HTTP_PORT'] ?? 3002),
    meili: {
      host: env['MEILI_HOST'] ?? `http://localhost:${env['MEILI_PORT'] ?? 7700}`,
      apiKey: env['MEILI_MASTER_KEY'] ?? 'local_dev_master_key_change_me',
      indexName: 'listings',
    },
    kafka: {
      brokers: (env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
      clientId: 'search',
    },
  };
}
