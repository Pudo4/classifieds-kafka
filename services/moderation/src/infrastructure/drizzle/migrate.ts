import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadConfig } from '../config.js';
import { createDb } from './db.js';

const config = loadConfig();
const db = createDb(config.db);
const migrationsFolder = fileURLToPath(new URL('../../../drizzle', import.meta.url));

await migrate(db, { migrationsFolder });
// eslint-disable-next-line no-console -- CLI script, this is the success output
console.log('moderation_db migrated');
process.exit(0);
