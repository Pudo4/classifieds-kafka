export interface BffServiceConfig {
  httpPort: number;
  services: {
    listing: string;
    search: string;
    media: string;
    engagement: string;
    notification: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BffServiceConfig {
  return {
    httpPort: Number(env['BFF_HTTP_PORT'] ?? 3000),
    services: {
      listing: env['LISTING_SERVICE_URL'] ?? 'http://localhost:3001',
      search: env['SEARCH_SERVICE_URL'] ?? 'http://localhost:3002',
      media: env['MEDIA_SERVICE_URL'] ?? 'http://localhost:3004',
      engagement: env['ENGAGEMENT_SERVICE_URL'] ?? 'http://localhost:3005',
      notification: env['NOTIFICATION_SERVICE_URL'] ?? 'http://localhost:3006',
    },
  };
}
