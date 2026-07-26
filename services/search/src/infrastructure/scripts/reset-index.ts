/**
 * Half of the replay procedure documented in the README. Run this, then
 * reset the `search` consumer group's offset to earliest with
 * `kafka-consumer-groups.sh`, then restart the service -- `ensureIndex()`
 * recreates the index on boot and the consumer rebuilds it from
 * `listing.snapshot.v1` from scratch.
 */
import { loadConfig } from '../config.js';
import { createMeiliClient } from '../meilisearch/client.js';

const config = loadConfig();
const client = createMeiliClient(config.meili);

const deleted = await client.deleteIndexIfExists(config.meili.indexName);
// eslint-disable-next-line no-console -- CLI script, this is the operator-facing output
console.log(deleted ? `deleted index "${config.meili.indexName}"` : `index "${config.meili.indexName}" did not exist`);
process.exit(0);
