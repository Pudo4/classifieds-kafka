import { Meilisearch } from 'meilisearch';
import type { SearchConfig } from '../config.js';

export function createMeiliClient(config: SearchConfig['meili']): Meilisearch {
  return new Meilisearch({ host: config.host, apiKey: config.apiKey });
}
