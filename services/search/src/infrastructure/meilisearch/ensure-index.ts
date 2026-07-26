import { MeilisearchApiError, type Meilisearch } from 'meilisearch';

/**
 * Idempotent: safe to call on every service startup, and it's also the
 * second half of the replay procedure -- after the index is deleted and
 * the `search` consumer group's offset is reset to earliest, restarting
 * the service calls this again to recreate the index with the right
 * settings before any documents land.
 */
export async function ensureIndex(client: Meilisearch, indexName: string): Promise<void> {
  const exists = await client
    .getIndex(indexName)
    .then(() => true)
    .catch((error: unknown) => {
      if (error instanceof MeilisearchApiError && error.response.status === 404) return false;
      throw error;
    });

  if (!exists) {
    await client.createIndex(indexName, { primaryKey: 'id' }).waitTask();
  }

  const index = client.index(indexName);
  await index.updateFilterableAttributes(['status', 'category', 'priceCents']).waitTask();
  await index.updateSearchableAttributes(['title', 'description']).waitTask();
}
